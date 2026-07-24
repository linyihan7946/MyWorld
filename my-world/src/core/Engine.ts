import * as THREE from 'three'
import { EventBus } from './EventBus'
import { GameLoop } from './GameLoop'
import { CameraManager } from '@/rendering/Camera'
import { TextureAtlas } from '@/rendering/TextureAtlas'
import { ChunkMesher } from '@/rendering/ChunkMesher'
import { Sky } from '@/rendering/Sky'
import { InputManager } from '@/input/InputManager'
import { WorldGenerator } from '@/world/WorldGenerator'
import { ChunkManager } from '@/world/ChunkManager'
import { PhysicsEngine } from '@/physics/PhysicsEngine'
import { BlockInteraction } from '@/gameplay/BlockInteraction'
import { RedstoneSystem } from '@/gameplay/RedstoneSystem'
import { BlockType } from '@/types/blocks'
import { PLAYER_SPEED, PLAYER_SPRINT_SPEED, JUMP_VELOCITY, MOUSE_SENSITIVITY, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY } from '@/utils/constants'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { ITEM_REGISTRY } from '@/types/items'
import { EntityManager } from '@/entities/EntityManager'
import { Animal, type AnimalKind } from '@/entities/characters/Animal'
import { Zombie } from '@/entities/characters/Zombie'
import { useContainerStore } from '@/ui/stores/containerStore'

const ITEM_TO_BLOCK: Record<string, BlockType> = {
  // Basic blocks
  dirt: BlockType.DIRT, stone: BlockType.STONE, grass_block: BlockType.GRASS_BLOCK,
  cobblestone: BlockType.COBBLESTONE, oak_planks: BlockType.OAK_PLANKS,
  oak_log: BlockType.OAK_LOG, sand: BlockType.SAND, sandstone: BlockType.SANDSTONE,
  gravel: BlockType.GRAVEL, clay: BlockType.CLAY,
  crafting_table: BlockType.CRAFTING_TABLE, furnace: BlockType.FURNACE,
  obsidian: BlockType.OBSIDIAN, chest: BlockType.CHEST,
  bookshelf: BlockType.BOOKSHELF, tnt: BlockType.TNT, glass: BlockType.GLASS,
  glowstone: BlockType.GLOWSTONE, ladder: BlockType.LADDER,
  torch: BlockType.TORCH, soul_torch: BlockType.SOUL_TORCH,
  lantern: BlockType.LANTERN, soul_lantern: BlockType.SOUL_LANTERN,
  redstone_dust: BlockType.REDSTONE_DUST, piston: BlockType.PISTON,
  sticky_piston: BlockType.STICKY_PISTON, repeater: BlockType.REPEATER,
  comparator: BlockType.COMPARATOR, observer: BlockType.OBSERVER,
  hopper: BlockType.HOPPER,

  // Stone variants
  granite: BlockType.GRANITE, polished_granite: BlockType.POLISHED_GRANITE,
  diorite: BlockType.DIORITE, polished_diorite: BlockType.POLISHED_DIORITE,
  andesite: BlockType.ANDESITE, polished_andesite: BlockType.POLISHED_ANDESITE,
  smooth_stone: BlockType.SMOOTH_STONE, mossy_cobblestone: BlockType.MOSSY_COBBLESTONE,
  stone_bricks: BlockType.STONE_BRICKS, mossy_stone_bricks: BlockType.MOSSY_STONE_BRICKS,
  bricks: BlockType.BRICKS,

  // Wood variants
  spruce_log: BlockType.SPRUCE_LOG, spruce_planks: BlockType.SPRUCE_PLANKS,
  birch_log: BlockType.BIRCH_LOG, birch_planks: BlockType.BIRCH_PLANKS,
  jungle_log: BlockType.JUNGLE_LOG, jungle_planks: BlockType.JUNGLE_PLANKS,
  acacia_log: BlockType.ACACIA_LOG, acacia_planks: BlockType.ACACIA_PLANKS,
  dark_oak_log: BlockType.DARK_OAK_LOG, dark_oak_planks: BlockType.DARK_OAK_PLANKS,

  // Nether blocks
  netherrack: BlockType.NETHERRACK, soul_sand: BlockType.SOUL_SAND,
  basalt: BlockType.BASALT, blackstone: BlockType.BLACKSTONE,
  crimson_nylium: BlockType.CRIMSON_NYLIUM, warped_nylium: BlockType.WARPED_NYLIUM,
  magma_block: BlockType.MAGMA_BLOCK, nether_bricks: BlockType.NETHER_BRICKS,

  // End blocks
  end_stone: BlockType.END_STONE, purpur_block: BlockType.PURPUR_BLOCK,
  end_stone_bricks: BlockType.END_STONE_BRICKS, crying_obsidian: BlockType.CRYING_OBSIDIAN,

  // Mineral blocks
  iron_block: BlockType.IRON_BLOCK, gold_block: BlockType.GOLD_BLOCK,
  diamond_block: BlockType.DIAMOND_BLOCK, netherite_block: BlockType.NETHERITE_BLOCK,
  copper_block: BlockType.COPPER_BLOCK, emerald_block: BlockType.EMERALD_BLOCK,
  lapis_block: BlockType.LAPIS_BLOCK, redstone_block: BlockType.REDSTONE_BLOCK,
  quartz_block: BlockType.QUARTZ_BLOCK,

  // Ice and snow
  ice: BlockType.ICE, packed_ice: BlockType.PACKED_ICE, blue_ice: BlockType.BLUE_ICE,
  snow_block: BlockType.SNOW_BLOCK,

  // Plants
  cactus: BlockType.CACTUS, pumpkin: BlockType.PUMPKIN, melon: BlockType.MELON,
  hay_bale: BlockType.HAY_BALE, bone_block: BlockType.BONE_BLOCK,

  // Prismarine
  prismarine: BlockType.PRISMARINE, prismarine_bricks: BlockType.PRISMARINE_BRICKS,
  dark_prismarine: BlockType.DARK_PRISMARINE, sea_lantern: BlockType.SEA_LANTERN,

  // Stairs
  cobblestone_stairs: BlockType.COBBLESTONE_STAIRS, stone_brick_stairs: BlockType.STONE_BRICK_STAIRS,
  brick_stairs: BlockType.BRICK_STAIRS, oak_stairs: BlockType.OAK_STAIRS,
  spruce_stairs: BlockType.SPRUCE_STAIRS, birch_stairs: BlockType.BIRCH_STAIRS,
  sandstone_stairs: BlockType.SANDSTONE_STAIRS,

  // Slabs
  stone_slab: BlockType.STONE_SLAB, cobblestone_slab: BlockType.COBBLESTONE_SLAB,
  stone_brick_slab: BlockType.STONE_BRICK_SLAB, brick_slab: BlockType.BRICK_SLAB,
  oak_slab: BlockType.OAK_SLAB, spruce_slab: BlockType.SPRUCE_SLAB,
  birch_slab: BlockType.BIRCH_SLAB, sandstone_slab: BlockType.SANDSTONE_SLAB,

  // Fences
  oak_fence: BlockType.OAK_FENCE, spruce_fence: BlockType.SPRUCE_FENCE,
  birch_fence: BlockType.BIRCH_FENCE, jungle_fence: BlockType.JUNGLE_FENCE,
  acacia_fence: BlockType.ACACIA_FENCE, dark_oak_fence: BlockType.DARK_OAK_FENCE,
  nether_brick_fence: BlockType.NETHER_BRICK_FENCE,

  // Walls
  cobblestone_wall: BlockType.COBBLESTONE_WALL, mossy_cobblestone_wall: BlockType.MOSSY_COBBLESTONE_WALL,
  stone_brick_wall: BlockType.STONE_BRICK_WALL, brick_wall: BlockType.BRICK_WALL,
  andesite_wall: BlockType.ANDESITE_WALL, diorite_wall: BlockType.DIORITE_WALL,
  granite_wall: BlockType.GRANITE_WALL,

  // Utility blocks
  anvil: BlockType.ANVIL, grindstone: BlockType.GRINDSTONE, stonecutter: BlockType.STONECUTTER,
  loom: BlockType.LOOM, cartography_table: BlockType.CARTOGRAPHY_TABLE,
  fletching_table: BlockType.FLETCHING_TABLE, smithing_table: BlockType.SMITHING_TABLE,
  blast_furnace: BlockType.BLAST_FURNACE, smoker: BlockType.SMOKER,
  composter: BlockType.COMPOSTER, barrel: BlockType.BARREL, bell: BlockType.BELL,
  lectern: BlockType.LECTERN, beacon: BlockType.BEACON,

  // Wool
  white_wool: BlockType.WHITE_WOOL, orange_wool: BlockType.ORANGE_WOOL,
  magenta_wool: BlockType.MAGENTA_WOOL, light_blue_wool: BlockType.LIGHT_BLUE_WOOL,
  yellow_wool: BlockType.YELLOW_WOOL, lime_wool: BlockType.LIME_WOOL,
  pink_wool: BlockType.PINK_WOOL, gray_wool: BlockType.GRAY_WOOL,
  light_gray_wool: BlockType.LIGHT_GRAY_WOOL, cyan_wool: BlockType.CYAN_WOOL,
  purple_wool: BlockType.PURPLE_WOOL, blue_wool: BlockType.BLUE_WOOL,
  brown_wool: BlockType.BROWN_WOOL, green_wool: BlockType.GREEN_WOOL,
  red_wool: BlockType.RED_WOOL, black_wool: BlockType.BLACK_WOOL,

  // Concrete
  white_concrete: BlockType.WHITE_CONCRETE, orange_concrete: BlockType.ORANGE_CONCRETE,
  yellow_concrete: BlockType.YELLOW_CONCRETE, light_blue_concrete: BlockType.LIGHT_BLUE_CONCRETE,
  lime_concrete: BlockType.LIME_CONCRETE, pink_concrete: BlockType.PINK_CONCRETE,
  gray_concrete: BlockType.GRAY_CONCRETE, cyan_concrete: BlockType.CYAN_CONCRETE,
  purple_concrete: BlockType.PURPLE_CONCRETE, blue_concrete: BlockType.BLUE_CONCRETE,
  brown_concrete: BlockType.BROWN_CONCRETE, green_concrete: BlockType.GREEN_CONCRETE,
  red_concrete: BlockType.RED_CONCRETE, black_concrete: BlockType.BLACK_CONCRETE,

  // Terracotta
  terracotta: BlockType.TERRACOTTA,
}

/**
 * 物品 → 显示用方块类型（仅用于 HUD 颜色显示）
 */
const ITEM_DISPLAY_BLOCK: Record<string, BlockType> = {
  // 矿石材料
  coal: BlockType.COAL_ORE, iron_ingot: BlockType.IRON_ORE,
  gold_ingot: BlockType.GOLD_ORE, diamond: BlockType.DIAMOND_ORE,
  emerald: BlockType.EMERALD_BLOCK, lapis_lazuli: BlockType.LAPIS_BLOCK,
  redstone: BlockType.REDSTONE_BLOCK, quartz: BlockType.QUARTZ_BLOCK,
  netherite_ingot: BlockType.NETHERITE_BLOCK, netherite_scrap: BlockType.NETHERRACK,
  copper_ingot: BlockType.COPPER_BLOCK, charcoal: BlockType.COAL_ORE,
  // 基础材料
  stick: BlockType.OAK_PLANKS, flint: BlockType.GRAVEL,
  string: BlockType.WHITE_WOOL, feather: BlockType.WHITE_WOOL,
  leather: BlockType.BROWN_WOOL, brick_item: BlockType.BRICKS,
  clay_ball: BlockType.CLAY, paper: BlockType.BIRCH_PLANKS,
  book: BlockType.BOOKSHELF, ink_sac: BlockType.BLACK_WOOL,
  glowstone_dust: BlockType.GLOWSTONE, gunpowder: BlockType.GRAY_WOOL,
  blaze_rod: BlockType.GLOWSTONE, blaze_powder: BlockType.GLOWSTONE,
  ender_pearl: BlockType.END_STONE, ender_eye: BlockType.END_STONE,
  nether_star: BlockType.BEACON, bone: BlockType.BONE_BLOCK,
  bone_meal: BlockType.BONE_BLOCK, sugar: BlockType.WHITE_WOOL,
  wheat: BlockType.YELLOW_WOOL, wheat_seeds: BlockType.YELLOW_WOOL,
  // 工具
  wooden_pickaxe: BlockType.OAK_PLANKS, stone_pickaxe: BlockType.COBBLESTONE,
  iron_pickaxe: BlockType.IRON_BLOCK, gold_pickaxe: BlockType.GOLD_BLOCK,
  diamond_pickaxe: BlockType.DIAMOND_BLOCK, netherite_pickaxe: BlockType.NETHERITE_BLOCK,
  wooden_axe: BlockType.OAK_PLANKS, stone_axe: BlockType.COBBLESTONE,
  iron_axe: BlockType.IRON_BLOCK, gold_axe: BlockType.GOLD_BLOCK,
  diamond_axe: BlockType.DIAMOND_BLOCK, netherite_axe: BlockType.NETHERITE_BLOCK,
  wooden_shovel: BlockType.OAK_PLANKS, stone_shovel: BlockType.COBBLESTONE,
  iron_shovel: BlockType.IRON_BLOCK, gold_shovel: BlockType.GOLD_BLOCK,
  diamond_shovel: BlockType.DIAMOND_BLOCK, netherite_shovel: BlockType.NETHERITE_BLOCK,
  wooden_hoe: BlockType.OAK_PLANKS, stone_hoe: BlockType.COBBLESTONE,
  iron_hoe: BlockType.IRON_BLOCK, gold_hoe: BlockType.GOLD_BLOCK,
  diamond_hoe: BlockType.DIAMOND_BLOCK, netherite_hoe: BlockType.NETHERITE_BLOCK,
  // 武器
  wooden_sword: BlockType.OAK_PLANKS, stone_sword: BlockType.COBBLESTONE,
  iron_sword: BlockType.IRON_BLOCK, gold_sword: BlockType.GOLD_BLOCK,
  diamond_sword: BlockType.DIAMOND_BLOCK, netherite_sword: BlockType.NETHERITE_BLOCK,
  bow: BlockType.OAK_PLANKS, crossbow: BlockType.OAK_PLANKS,
  trident: BlockType.PRISMARINE, arrow: BlockType.COBBLESTONE,
  shield: BlockType.OAK_PLANKS,
  // 盔甲
  leather_helmet: BlockType.BROWN_WOOL, leather_chestplate: BlockType.BROWN_WOOL,
  leather_leggings: BlockType.BROWN_WOOL, leather_boots: BlockType.BROWN_WOOL,
  chainmail_helmet: BlockType.IRON_BLOCK, chainmail_chestplate: BlockType.IRON_BLOCK,
  chainmail_leggings: BlockType.IRON_BLOCK, chainmail_boots: BlockType.IRON_BLOCK,
  iron_helmet: BlockType.IRON_BLOCK, iron_chestplate: BlockType.IRON_BLOCK,
  iron_leggings: BlockType.IRON_BLOCK, iron_boots: BlockType.IRON_BLOCK,
  golden_helmet: BlockType.GOLD_BLOCK, golden_chestplate: BlockType.GOLD_BLOCK,
  golden_leggings: BlockType.GOLD_BLOCK, golden_boots: BlockType.GOLD_BLOCK,
  diamond_helmet: BlockType.DIAMOND_BLOCK, diamond_chestplate: BlockType.DIAMOND_BLOCK,
  diamond_leggings: BlockType.DIAMOND_BLOCK, diamond_boots: BlockType.DIAMOND_BLOCK,
  netherite_helmet: BlockType.NETHERITE_BLOCK, netherite_chestplate: BlockType.NETHERITE_BLOCK,
  netherite_leggings: BlockType.NETHERITE_BLOCK, netherite_boots: BlockType.NETHERITE_BLOCK,
  // 食物
  apple: BlockType.RED_WOOL, golden_apple: BlockType.GOLD_BLOCK,
  bread: BlockType.YELLOW_WOOL, cooked_beef: BlockType.BROWN_WOOL,
  cooked_porkchop: BlockType.BROWN_WOOL, cooked_chicken: BlockType.BROWN_WOOL,
  // 实用物品
  flint_and_steel: BlockType.IRON_BLOCK, shears: BlockType.IRON_BLOCK,
  fishing_rod: BlockType.OAK_PLANKS, compass: BlockType.IRON_BLOCK,
  clock: BlockType.GOLD_BLOCK, bucket: BlockType.IRON_BLOCK,
  spyglass: BlockType.COPPER_BLOCK, elytra: BlockType.GRAY_WOOL,
  totem_of_undying: BlockType.GOLD_BLOCK,
}

const BLOCK_TO_ITEM: Record<number, string> = {
  // Basic
  [BlockType.STONE]: 'cobblestone', [BlockType.DIRT]: 'dirt',
  [BlockType.GRASS_BLOCK]: 'dirt', [BlockType.COBBLESTONE]: 'cobblestone',
  [BlockType.OAK_PLANKS]: 'oak_planks', [BlockType.OAK_LOG]: 'oak_log',
  [BlockType.OAK_LEAVES]: 'oak_planks', [BlockType.SAND]: 'sand',
  [BlockType.SANDSTONE]: 'sandstone', [BlockType.GRAVEL]: 'gravel',
  [BlockType.CLAY]: 'clay_ball', [BlockType.CRAFTING_TABLE]: 'crafting_table',
  [BlockType.FURNACE]: 'furnace', [BlockType.OBSIDIAN]: 'obsidian',
  [BlockType.CHEST]: 'chest', [BlockType.BOOKSHELF]: 'bookshelf',
  [BlockType.TNT]: 'tnt', [BlockType.GLASS]: 'glass',
  [BlockType.GLOWSTONE]: 'glowstone_dust',
  [BlockType.REDSTONE_DUST]: 'redstone_dust', [BlockType.PISTON]: 'piston',
  [BlockType.STICKY_PISTON]: 'sticky_piston', [BlockType.REPEATER]: 'repeater',
  [BlockType.COMPARATOR]: 'comparator', [BlockType.OBSERVER]: 'observer',
  [BlockType.HOPPER]: 'hopper',
  // Ores
  [BlockType.COAL_ORE]: 'coal', [BlockType.IRON_ORE]: 'iron_ingot',
  [BlockType.GOLD_ORE]: 'gold_ingot', [BlockType.DIAMOND_ORE]: 'diamond',
  [BlockType.EMERALD_ORE]: 'emerald', [BlockType.REDSTONE_ORE]: 'redstone',
  [BlockType.LAPIS_ORE]: 'lapis_lazuli', [BlockType.COPPER_ORE]: 'copper_ingot',
  [BlockType.NETHER_GOLD_ORE]: 'gold_ingot', [BlockType.NETHER_QUARTZ_ORE]: 'quartz',
  // Stone variants
  [BlockType.GRANITE]: 'granite', [BlockType.POLISHED_GRANITE]: 'polished_granite',
  [BlockType.DIORITE]: 'diorite', [BlockType.POLISHED_DIORITE]: 'polished_diorite',
  [BlockType.ANDESITE]: 'andesite', [BlockType.POLISHED_ANDESITE]: 'polished_andesite',
  [BlockType.SMOOTH_STONE]: 'smooth_stone', [BlockType.MOSSY_COBBLESTONE]: 'mossy_cobblestone',
  [BlockType.STONE_BRICKS]: 'stone_bricks', [BlockType.MOSSY_STONE_BRICKS]: 'mossy_stone_bricks',
  [BlockType.BRICKS]: 'bricks',
  // Wood variants
  [BlockType.SPRUCE_LOG]: 'spruce_log', [BlockType.SPRUCE_PLANKS]: 'spruce_planks',
  [BlockType.BIRCH_LOG]: 'birch_log', [BlockType.BIRCH_PLANKS]: 'birch_planks',
  [BlockType.JUNGLE_LOG]: 'jungle_log', [BlockType.JUNGLE_PLANKS]: 'jungle_planks',
  [BlockType.ACACIA_LOG]: 'acacia_log', [BlockType.ACACIA_PLANKS]: 'acacia_planks',
  [BlockType.DARK_OAK_LOG]: 'dark_oak_log', [BlockType.DARK_OAK_PLANKS]: 'dark_oak_planks',
  // Nether
  [BlockType.NETHERRACK]: 'netherrack', [BlockType.SOUL_SAND]: 'soul_sand',
  [BlockType.SOUL_SOIL]: 'soul_sand', [BlockType.BASALT]: 'basalt',
  [BlockType.BLACKSTONE]: 'blackstone', [BlockType.MAGMA_BLOCK]: 'magma_block',
  [BlockType.NETHER_BRICKS]: 'nether_bricks',
  // End
  [BlockType.END_STONE]: 'end_stone', [BlockType.PURPUR_BLOCK]: 'purpur_block',
  [BlockType.END_STONE_BRICKS]: 'end_stone_bricks', [BlockType.CRYING_OBSIDIAN]: 'crying_obsidian',
  // Mineral blocks
  [BlockType.IRON_BLOCK]: 'iron_block', [BlockType.GOLD_BLOCK]: 'gold_block',
  [BlockType.DIAMOND_BLOCK]: 'diamond_block', [BlockType.NETHERITE_BLOCK]: 'netherite_block',
  [BlockType.COPPER_BLOCK]: 'copper_block', [BlockType.EMERALD_BLOCK]: 'emerald_block',
  [BlockType.LAPIS_BLOCK]: 'lapis_block', [BlockType.REDSTONE_BLOCK]: 'redstone_block',
  [BlockType.QUARTZ_BLOCK]: 'quartz_block',
  // Ice/snow
  [BlockType.ICE]: 'ice', [BlockType.PACKED_ICE]: 'packed_ice',
  [BlockType.BLUE_ICE]: 'blue_ice', [BlockType.SNOW_BLOCK]: 'snow_block',
  [BlockType.SNOW]: 'snow_block',
  // Plants
  [BlockType.CACTUS]: 'cactus', [BlockType.PUMPKIN]: 'pumpkin',
  [BlockType.MELON]: 'melon_slice', [BlockType.HAY_BALE]: 'hay_bale',
  [BlockType.BONE_BLOCK]: 'bone_block',
  // Prismarine
  [BlockType.PRISMARINE]: 'prismarine', [BlockType.PRISMARINE_BRICKS]: 'prismarine_bricks',
  [BlockType.DARK_PRISMARINE]: 'dark_prismarine', [BlockType.SEA_LANTERN]: 'sea_lantern',
  // Utility
  [BlockType.ANVIL]: 'anvil', [BlockType.GRINDSTONE]: 'grindstone',
  [BlockType.STONECUTTER]: 'stonecutter', [BlockType.LOOM]: 'loom',
  [BlockType.BLAST_FURNACE]: 'blast_furnace', [BlockType.SMOKER]: 'smoker',
  [BlockType.COMPOSTER]: 'composter', [BlockType.BARREL]: 'barrel',
  [BlockType.BELL]: 'bell', [BlockType.LECTERN]: 'lectern', [BlockType.BEACON]: 'beacon',
  // Wool (all drop their own color)
  [BlockType.WHITE_WOOL]: 'white_wool', [BlockType.ORANGE_WOOL]: 'orange_wool',
  [BlockType.MAGENTA_WOOL]: 'magenta_wool', [BlockType.LIGHT_BLUE_WOOL]: 'light_blue_wool',
  [BlockType.YELLOW_WOOL]: 'yellow_wool', [BlockType.LIME_WOOL]: 'lime_wool',
  [BlockType.PINK_WOOL]: 'pink_wool', [BlockType.GRAY_WOOL]: 'gray_wool',
  [BlockType.LIGHT_GRAY_WOOL]: 'light_gray_wool', [BlockType.CYAN_WOOL]: 'cyan_wool',
  [BlockType.PURPLE_WOOL]: 'purple_wool', [BlockType.BLUE_WOOL]: 'blue_wool',
  [BlockType.BROWN_WOOL]: 'brown_wool', [BlockType.GREEN_WOOL]: 'green_wool',
  [BlockType.RED_WOOL]: 'red_wool', [BlockType.BLACK_WOOL]: 'black_wool',
}

/** 获取物品的显示方块类型（用于 HUD 颜色） */
function getItemDisplayBlock(itemId: string): BlockType {
  return ITEM_TO_BLOCK[itemId] ?? ITEM_DISPLAY_BLOCK[itemId] ?? BlockType.AIR
}

export class Engine {
  public eventBus: EventBus
  public gameLoop: GameLoop
  public inputManager: InputManager

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  public cameraManager!: CameraManager
  private textureAtlas!: TextureAtlas
  private chunkMesher!: ChunkMesher
  private sky!: Sky

  private worldGenerator!: WorldGenerator
  private chunkManager!: ChunkManager
  private physicsEngine!: PhysicsEngine
  private blockInteraction!: BlockInteraction
  private redstoneSystem!: RedstoneSystem
  private entityManager!: EntityManager
  private ambientLight!: THREE.AmbientLight
  private sunLight!: THREE.DirectionalLight

  // Player state
  private playerPosition = new THREE.Vector3(8, 80, 8)
  private playerVelocity = new THREE.Vector3(0, 0, 0)
  private playerOnGround = false
  private yaw = 0
  private pitch = 0

  // Break timing
  private breakInterval: number | null = null
  private isBreaking = false

  // === NEW: Game mode ===
  private gameMode: 'survival' | 'creative' = 'survival' // default survival
  private isFlying = false
  private lastSpaceTap = 0
  private flySpeed = 10

  // === NEW: Fall damage ===
  private fallStartY = 0
  private wasInAir = false

  // === NEW: Underwater ===
  private isUnderwater = false
  private underwaterOverlay!: THREE.Mesh

  // === NEW: Oxygen ===
  private oxygen = 10
  private maxOxygen = 10
  private oxygenTimer = 0          // accumulator for oxygen depletion (seconds)
  private drownDamageTimer = 0     // accumulator for drowning damage (seconds)
  private oxygenRegenTimer = 0     // accumulator for oxygen regeneration (seconds)

  // === NEW: Death and health ===
  private isDead = false
  private healthRegenTimer = 0     // accumulator for health regeneration (seconds)
  private lastDamageTime = 0       // timestamp of last damage taken

  // Day/night and creature spawning
  private timeOfDay = 0.4
  private readonly dayLengthSeconds = 480
  private daylight = 1
  private mobSpawnTimer = 0
  private nextEntityId = 1
  private isRespawning = false

  private container: HTMLElement
  private seed: number
  private superflat: boolean

  constructor(container: HTMLElement, seed?: number, superflat = false) {
    this.container = container
    this.seed = seed ?? Math.floor(Math.random() * 2147483647)
    this.superflat = superflat
    this.eventBus = new EventBus()
    this.gameLoop = new GameLoop()
    this.inputManager = new InputManager()
  }

  async init(): Promise<void> {
    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x87CEEB)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()

    this.cameraManager = new CameraManager(window.innerWidth / window.innerHeight)
    this.cameraManager.setTargetPosition(this.playerPosition)

    this.textureAtlas = new TextureAtlas()
    this.chunkMesher = new ChunkMesher(this.textureAtlas)

    this.sky = new Sky()
    this.scene.add(this.sky.mesh)

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambientLight)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.sunLight.position.set(50, 100, 30)
    this.sunLight.castShadow = true
    this.sunLight.shadow.mapSize.set(1024, 1024)
    this.sunLight.shadow.camera.left = -48
    this.sunLight.shadow.camera.right = 48
    this.sunLight.shadow.camera.top = 48
    this.sunLight.shadow.camera.bottom = -48
    this.scene.add(this.sunLight)
    this.scene.add(this.sunLight.target)

    // Underwater overlay (fullscreen quad rendered by UI, we track state)
    this.isUnderwater = false

    this.inputManager.attach(this.renderer.domElement)
    this.setupInputHandlers()

    this.worldGenerator = new WorldGenerator(this.seed, this.superflat)
    this.chunkManager = new ChunkManager(this.scene, this.chunkMesher, this.worldGenerator)
    this.cameraManager.setCollisionRaycast((origin, direction, distance) => {
      return this.chunkManager.raycast(origin, direction, distance)?.distance ?? null
    })
    this.physicsEngine = new PhysicsEngine(this.chunkManager)
    this.blockInteraction = new BlockInteraction(this.chunkManager, this.eventBus, this.scene)
    this.redstoneSystem = new RedstoneSystem(this.chunkManager, this.eventBus)
    this.entityManager = new EntityManager(this.scene)

    const initialSpawn = this.findSafeSpawn(0, 0, 0, 320)
    this.playerPosition.x = initialSpawn.x + 0.5
    this.playerPosition.z = initialSpawn.z + 0.5

    const spawnChunkX = Math.floor(this.playerPosition.x / 16)
    const spawnChunkZ = Math.floor(this.playerPosition.z / 16)
    await this.chunkManager.updateChunks(spawnChunkX, spawnChunkZ)

    const px = Math.floor(this.playerPosition.x)
    const pz = Math.floor(this.playerPosition.z)
    let bestY = 0
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const h = this.chunkManager.getHeightAt(px + dx, pz + dz)
        if (h > bestY) bestY = h
      }
    }
    // 生成在地面上方 2 格，不要生成在高空
    this.playerPosition.y = bestY + 2
    this.fallStartY = this.playerPosition.y

    // Init player store
    const pStore = usePlayerStore()
    pStore.gameMode = this.gameMode
    pStore.isFlying = this.isFlying
    pStore.oxygen = this.oxygen
    pStore.maxOxygen = this.maxOxygen
    pStore.health = pStore.maxHealth  // 初始血量满
    pStore.worldSeed = this.seed
    pStore.timeOfDay = this.timeOfDay
    // Ensure inventory matches starting mode
    const inv = useInventoryStore()
    if (this.gameMode === 'creative') {
      inv.setCreativeInventory()
    } else {
      inv.setSurvivalInventory()
    }

    window.addEventListener('resize', () => this.onResize())

    this.gameLoop.start(
      (dt) => this.update(dt),
      (dt) => this.render(dt),
    )
  }

  private setupInputHandlers(): void {
    this.inputManager.onKeyDown = (key: string) => {
      if (key === 'F5') this.cameraManager.toggleMode()

      if (key === 'KeyE') {
        if (document.pointerLockElement) document.exitPointerLock()
      }

      // G key: toggle game mode
      if (key === 'KeyG') {
        this.toggleGameMode()
      }

      // Space: double-tap to toggle flying (creative mode)
      if (key === 'Space') {
        if (this.gameMode === 'creative') {
          const now = performance.now()
          if (now - this.lastSpaceTap < 300) {
            this.isFlying = !this.isFlying
            if (this.isFlying) this.playerVelocity.y = 0
            this.eventBus.emit('game:flyingChanged', this.isFlying)
            const pStore = usePlayerStore()
            pStore.isFlying = this.isFlying
          }
          this.lastSpaceTap = now
        }
      }

      if (key >= 'Digit1' && key <= 'Digit9') {
        const slot = parseInt(key.replace('Digit', '')) - 1
        this.eventBus.emit('hotbar:select', slot)
      }
    }

    this.inputManager.onMouseMove = (dx: number, dy: number) => {
      this.yaw -= dx * MOUSE_SENSITIVITY
      this.pitch -= dy * MOUSE_SENSITIVITY
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))
      this.cameraManager.setRotation(this.yaw, this.pitch)
    }

    this.inputManager.onMouseDown = (button: number) => {
      if (!this.inputManager.locked) return
      if (button === 0) {
        this.isBreaking = true
        this.startBreaking()
      } else if (button === 2) {
        const forcePlace = this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight')
        if (forcePlace || !this.openTargetContainer()) this.placeBlock()
      }
    }

    this.inputManager.onMouseUp = (button: number) => {
      if (button === 0) {
        this.isBreaking = false
        this.stopBreaking()
      }
    }

    this.eventBus.on('block:broke', (data: { position: THREE.Vector3; blockType: number; canHarvest?: boolean }) => {
      if (data.blockType === BlockType.CHEST || data.blockType === BlockType.BARREL || data.blockType === BlockType.HOPPER) {
        const contents = useContainerStore().removeContainer(data.position.x, data.position.y, data.position.z)
        const inventory = useInventoryStore()
        for (const slot of contents) {
          if (slot.item) inventory.addItem(slot.item, slot.count, slot.blockType)
        }
      }

      // In creative mode, don't add blocks to inventory
      if (this.gameMode === 'creative') return

      // Only drop items if the tool can harvest this block (1:1 MC mechanic)
      if (data.canHarvest === false) return

      const itemId = BLOCK_TO_ITEM[data.blockType]
      if (itemId) {
        const inv = useInventoryStore()
        inv.addToHotbar(getItemDisplayBlock(itemId), itemId, 1)
      }
    })
  }

  private toggleGameMode(): void {
    this.gameMode = this.gameMode === 'survival' ? 'creative' : 'survival'
    const inv = useInventoryStore()
    if (this.gameMode === 'creative') {
      inv.setCreativeInventory()
    } else {
      this.isFlying = false
      inv.setSurvivalInventory()
    }
    const pStore = usePlayerStore()
    pStore.gameMode = this.gameMode
    pStore.isFlying = this.isFlying
    this.eventBus.emit('game:modeChanged', this.gameMode)
  }

  private startBreaking(): void {
    if (this.breakInterval) return
    const isCreative = this.gameMode === 'creative'
    const interval = isCreative ? 10 : 50

    this.breakInterval = window.setInterval(() => {
      if (!this.isBreaking) {
        this.stopBreaking()
        usePlayerStore().breakProgress = 0
        usePlayerStore().breakToolName = null
        return
      }
      const result = this.blockInteraction.breakHit(isCreative)

      // Update player store for HUD display
      const pStore = usePlayerStore()
      pStore.breakProgress = result.progress
      pStore.breakCanHarvest = result.canHarvest

      // Show current tool name if mining
      if (result.breaking) {
        const inv = useInventoryStore()
        const slot = inv.hotbar[inv.selectedSlot]
        pStore.breakToolName = slot?.item ? (ITEM_REGISTRY[slot.item]?.name ?? slot.item) : '空手'
      } else {
        pStore.breakToolName = null
      }
    }, interval)
  }

  private stopBreaking(): void {
    if (this.breakInterval) { clearInterval(this.breakInterval); this.breakInterval = null }
  }

  private placeBlock(): void {
    const inv = useInventoryStore()
    const selectedSlot = inv.hotbar[inv.selectedSlot]

    // Creative mode: always allow placing (infinite blocks)
    if (this.gameMode === 'creative') {
      // If no block selected, default to stone
      const blockType = selectedSlot?.blockType ?? BlockType.STONE
      const halfWidth = PLAYER_WIDTH / 2
      const playerAABB = {
        minX: this.playerPosition.x - halfWidth, maxX: this.playerPosition.x + halfWidth,
        minY: this.playerPosition.y, maxY: this.playerPosition.y + PLAYER_HEIGHT,
        minZ: this.playerPosition.z - halfWidth, maxZ: this.playerPosition.z + halfWidth,
      }
      this.blockInteraction.placeBlock(blockType, playerAABB)
      return
    }

    // Survival: consume block
    if (!selectedSlot?.item || !selectedSlot.blockType) return
    const halfWidth = PLAYER_WIDTH / 2
    const playerAABB = {
      minX: this.playerPosition.x - halfWidth, maxX: this.playerPosition.x + halfWidth,
      minY: this.playerPosition.y, maxY: this.playerPosition.y + PLAYER_HEIGHT,
      minZ: this.playerPosition.z - halfWidth, maxZ: this.playerPosition.z + halfWidth,
    }
    const placed = this.blockInteraction.placeBlock(selectedSlot.blockType, playerAABB)
    if (placed) inv.removeFromSelected()
  }

  private openTargetContainer(): boolean {
    const target = this.blockInteraction.getTargetBlock()
    if (!target) return false
    if (this.redstoneSystem.interact(target.position)) return true

    const { position, blockType } = target
    if (blockType !== BlockType.CHEST && blockType !== BlockType.BARREL && blockType !== BlockType.HOPPER) return false

    const positions = [{ x: position.x, y: position.y, z: position.z }]
    if (blockType === BlockType.CHEST) {
      const horizontalNeighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      for (const [dx, dz] of horizontalNeighbors) {
        if (this.chunkManager.getBlock(position.x + dx, position.y, position.z + dz) === BlockType.CHEST) {
          positions.push({ x: position.x + dx, y: position.y, z: position.z + dz })
          break
        }
      }
    }

    useInventoryStore().showInventory = false
    useContainerStore().openContainer(blockType, positions)
    if (document.pointerLockElement) document.exitPointerLock()
    return true
  }

  /**
   * Check if player head is in water
   */
  private checkUnderwater(): boolean {
    const headY = Math.floor(this.playerPosition.y + PLAYER_HEIGHT * 0.8)
    const block = this.chunkManager.getBlock(
      Math.floor(this.playerPosition.x),
      headY,
      Math.floor(this.playerPosition.z),
    )
    return block === BlockType.WATER
  }

  /** 身体仍在水中时继续使用游泳控制，即使头已经露出水面。 */
  private checkSwimming(): boolean {
    const x = Math.floor(this.playerPosition.x)
    const z = Math.floor(this.playerPosition.z)
    const feet = this.chunkManager.getBlock(x, Math.floor(this.playerPosition.y + 0.15), z)
    const torso = this.chunkManager.getBlock(x, Math.floor(this.playerPosition.y + 0.9), z)
    return feet === BlockType.WATER || torso === BlockType.WATER
  }

  /**
   * Apply damage to player, accounting for armor
   */
  private applyDamage(baseDamage: number, source: string): void {
    if (this.gameMode !== 'survival' || this.isDead) return

    const inv = useInventoryStore()
    const armorDefense = inv.getArmorDefense()
    // Each armor point reduces damage by 4%, max 80% reduction
    const reduction = Math.min(0.8, armorDefense * 0.04)
    const actualDamage = Math.max(1, Math.floor(baseDamage * (1 - reduction)))

    const pStore = usePlayerStore()
    pStore.health = Math.max(0, pStore.health - actualDamage)
    this.lastDamageTime = performance.now() / 1000
    this.healthRegenTimer = 0
    this.eventBus.emit('player:damage', { amount: actualDamage, source, armorReduced: baseDamage - actualDamage })
  }

  private update(dt: number): void {
    this.updateDayNight(dt)

    // Skip all movement/physics when dead
    if (this.isDead) {
      // Still update camera and chunks for death screen background
      this.cameraManager.setTargetPosition(this.playerPosition)
      this.cameraManager.update()

      const chunkX = Math.floor(this.playerPosition.x / 16)
      const chunkZ = Math.floor(this.playerPosition.z / 16)
      this.chunkManager.updateChunks(chunkX, chunkZ)

      this.eventBus.emit('player:position', {
        x: Math.floor(this.playerPosition.x),
        y: Math.floor(this.playerPosition.y),
        z: Math.floor(this.playerPosition.z),
      })
      return
    }

    const movement = this.inputManager.getMovement()
    this.isUnderwater = this.checkUnderwater()
    const isSwimming = this.checkSwimming()

    // === Flying movement (creative mode) ===
    if (this.isFlying) {
      const flySpeed = movement.sprint ? this.flySpeed * 2 : this.flySpeed
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      const moveDir = new THREE.Vector3(0, 0, 0)
      if (movement.forward) moveDir.add(forward)
      if (movement.backward) moveDir.sub(forward)
      if (movement.left) moveDir.sub(right)
      if (movement.right) moveDir.add(right)

      // Vertical: space = up, shift = down
      if (movement.jump) moveDir.y += 1
      if (this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight')) moveDir.y -= 1

      if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(flySpeed)

      this.playerVelocity.set(moveDir.x, moveDir.y, moveDir.z)
      this.playerPosition.add(this.playerVelocity.clone().multiplyScalar(dt))

      // Reset fall tracking while flying
      this.fallStartY = this.playerPosition.y
      this.wasInAir = false
    }
    // === Underwater swimming ===
    else if (isSwimming) {
      const swimSpeed = PLAYER_SPEED * 0.5
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      const moveDir = new THREE.Vector3(0, 0, 0)
      if (movement.forward) moveDir.add(forward)
      if (movement.backward) moveDir.sub(forward)
      if (movement.left) moveDir.sub(right)
      if (movement.right) moveDir.add(right)
      if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(swimSpeed)

      this.playerVelocity.x = moveDir.x
      this.playerVelocity.z = moveDir.z

      // Swim up/down
      if (movement.jump) {
        this.playerVelocity.y = 4.5
      } else if (this.inputManager.isKeyPressed('ShiftLeft')) {
        this.playerVelocity.y = -3 // Sink
      } else {
        // Water drag
        this.playerVelocity.y *= 0.9
      }

      // Reduced gravity underwater
      this.playerVelocity.y += GRAVITY * 0.1 * dt
      this.playerVelocity.y = Math.max(this.playerVelocity.y, -4) // Slow terminal velocity

      // Apply position with collision. Gravity was already applied above, so do
      // not apply it a second time in the physics engine.
      const swimStart = this.playerPosition.clone()
      const result = this.physicsEngine.update(this.playerPosition, this.playerVelocity, dt, false, 0)

      if (movement.jump && moveDir.lengthSq() > 0) {
        const stepped = this.physicsEngine.trySwimStepUp(swimStart, moveDir, dt)
        if (stepped) {
          result.position.copy(stepped)
          result.velocity.y = Math.max(result.velocity.y, 2.5)
        }
      }
      this.playerPosition.copy(result.position)
      this.playerVelocity.copy(result.velocity)
      this.playerOnGround = result.onGround

      this.fallStartY = this.playerPosition.y
      this.wasInAir = false
    }
    // === Normal movement ===
    else {
      const speed = movement.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      const moveDir = new THREE.Vector3(0, 0, 0)
      if (movement.forward) moveDir.add(forward)
      if (movement.backward) moveDir.sub(forward)
      if (movement.left) moveDir.sub(right)
      if (movement.right) moveDir.add(right)
      if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(speed)

      this.playerVelocity.x = moveDir.x
      this.playerVelocity.z = moveDir.z

      // Jump
      if (movement.jump && this.playerOnGround) {
        this.playerVelocity.y = JUMP_VELOCITY
        this.playerOnGround = false
      }

      // Track falling for fall damage
      if (!this.playerOnGround && this.playerVelocity.y < 0) {
        if (!this.wasInAir) {
          this.fallStartY = this.playerPosition.y
          this.wasInAir = true
        }
      }

      const result = this.physicsEngine.update(this.playerPosition, this.playerVelocity, dt, this.playerOnGround)
      this.playerPosition.copy(result.position)
      this.playerVelocity.copy(result.velocity)

      // === Fall damage ===
      if (result.onGround && this.wasInAir && this.gameMode === 'survival') {
        const fallDist = this.fallStartY - this.playerPosition.y
        if (fallDist > 3) {
          const damage = Math.floor(fallDist - 3)
          this.applyDamage(damage, 'fall')
        }
      }
      if (result.onGround) {
        this.wasInAir = false
        this.fallStartY = this.playerPosition.y
      }
      this.playerOnGround = result.onGround
    }

    // === Oxygen system ===
    const pStoreOxy = usePlayerStore()
    if (this.isUnderwater) {
      // Deplete oxygen: lose 1 oxygen every 1.5 seconds underwater
      this.oxygenTimer += dt
      if (this.oxygenTimer >= 1.5) {
        this.oxygenTimer -= 1.5
        this.oxygen = Math.max(0, this.oxygen - 1)
        pStoreOxy.oxygen = this.oxygen
      }

      // Drowning damage: when oxygen is 0, take 1 damage every 2 seconds
      if (this.oxygen <= 0 && this.gameMode === 'survival') {
        this.drownDamageTimer += dt
        if (this.drownDamageTimer >= 2) {
          this.drownDamageTimer -= 2
          this.applyDamage(1, 'drowning')
        }
      }
      // Reset regen timer while underwater
      this.oxygenRegenTimer = 0
    } else {
      // Regenerate oxygen: gain 1 oxygen every 0.5 seconds when not underwater
      if (this.oxygen < this.maxOxygen) {
        this.oxygenRegenTimer += dt
        if (this.oxygenRegenTimer >= 0.5) {
          this.oxygenRegenTimer -= 0.5
          this.oxygen = Math.min(this.maxOxygen, this.oxygen + 1)
          pStoreOxy.oxygen = this.oxygen
        }
      }
      // Reset depletion timers when out of water
      this.oxygenTimer = 0
      this.drownDamageTimer = 0
    }

    // === Death check ===
    if (this.gameMode === 'survival' && pStoreOxy.health <= 0 && !this.isDead) {
      this.isDead = true
      pStoreOxy.isDead = true
      pStoreOxy.deathCount++
      // Clear inventory on death
      const inv = useInventoryStore()
      inv.setSurvivalInventory()
      this.eventBus.emit('player:died', { deathCount: pStoreOxy.deathCount })
    }

    // === Health regeneration (survival only) ===
    // Regenerate 1 health every 3 seconds if not taking damage for 5 seconds
    if (this.gameMode === 'survival' && !this.isDead) {
      const now = performance.now() / 1000
      const timeSinceDamage = now - this.lastDamageTime
      if (timeSinceDamage >= 5 && pStoreOxy.health < pStoreOxy.maxHealth) {
        this.healthRegenTimer += dt
        if (this.healthRegenTimer >= 3) {
          this.healthRegenTimer -= 3
          pStoreOxy.health = Math.min(pStoreOxy.maxHealth, pStoreOxy.health + 1)
        }
      } else {
        this.healthRegenTimer = 0
      }
    }

    // Camera
    this.cameraManager.setTargetPosition(this.playerPosition)
    this.cameraManager.update()
    this.sky.updatePosition(this.playerPosition)

    // Underwater visual: update fog and clear color
    if (this.isUnderwater) {
      this.renderer.setClearColor(0x1a3a6a)
      this.scene.fog = new THREE.Fog(0x1a3a6a, 2, 20)
    } else {
      this.scene.fog = null
    }

    // Block interaction
    const camPos = this.cameraManager.activeCamera.position.clone()
    const camDir = this.cameraManager.getForwardDirection()
    this.blockInteraction.update(camPos, camDir)

    // Chunks
    const chunkX = Math.floor(this.playerPosition.x / 16)
    const chunkZ = Math.floor(this.playerPosition.z / 16)
    this.chunkManager.updateFluids(dt)
    this.redstoneSystem.update(dt)
    this.chunkManager.updateChunks(chunkX, chunkZ)
    this.chunkManager.updateDynamicLights(this.playerPosition)
    this.updateCreatures(dt)

    this.eventBus.emit('player:position', {
      x: Math.floor(this.playerPosition.x),
      y: Math.floor(this.playerPosition.y),
      z: Math.floor(this.playerPosition.z),
    })
    this.eventBus.emit('player:underwater', this.isUnderwater)
  }

  private render(_dt: number): void {
    this.chunkManager.updateAnimation(performance.now() * 0.001)
    this.renderer.render(this.scene, this.cameraManager.activeCamera)
  }

  private updateDayNight(dt: number): void {
    this.timeOfDay = (this.timeOfDay + dt / this.dayLengthSeconds) % 1
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2
    const sunDirection = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0.28).normalize()
    this.daylight = THREE.MathUtils.smoothstep(sunDirection.y, -0.18, 0.12)

    const nightSky = new THREE.Color(0x071020)
    const daySky = new THREE.Color(0x87ceeb)
    const skyColor = nightSky.clone().lerp(daySky, this.daylight)
    const ambient = 0.08 + this.daylight * 0.47

    this.sky.updateCycle(this.daylight, sunDirection)
    this.ambientLight.intensity = ambient
    this.sunLight.intensity = 0.04 + this.daylight * 0.92
    this.sunLight.color.set(this.daylight < 0.45 ? 0xffb36b : 0xffffff)
    this.sunLight.position.copy(this.playerPosition).addScaledVector(sunDirection, 120)
    this.sunLight.target.position.copy(this.playerPosition)
    this.chunkMesher.updateEnvironment(sunDirection, ambient, skyColor)

    if (!this.isUnderwater) this.renderer.setClearColor(skyColor)
    usePlayerStore().timeOfDay = this.timeOfDay
  }

  private updateCreatures(dt: number): void {
    this.entityManager.update(dt)
    this.mobSpawnTimer -= dt
    if (this.mobSpawnTimer > 0 || this.isDead) return
    this.mobSpawnTimer = 1

    const isNight = this.daylight < 0.18
    for (const entity of this.entityManager.getAllEntities()) {
      const tooFar = entity.position.distanceToSquared(this.playerPosition) > 96 * 96
      if (tooFar || (!isNight && entity instanceof Zombie)) {
        this.entityManager.removeEntity(entity.id)
      }
    }

    const entities = this.entityManager.getAllEntities()
    const animalCount = entities.filter(entity => entity instanceof Animal).length
    const zombieCount = entities.filter(entity => entity instanceof Zombie).length

    if (animalCount < 7) this.spawnAnimal()
    if (isNight && zombieCount < 20) {
      this.spawnZombie()
      if (zombieCount < 16) this.spawnZombie()
    }
  }

  private findCreatureSpawn(): THREE.Vector3 | null {
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = Math.random() * Math.PI * 2
      const distance = 18 + Math.random() * 24
      const x = Math.floor(this.playerPosition.x + Math.cos(angle) * distance)
      const z = Math.floor(this.playerPosition.z + Math.sin(angle) * distance)
      const y = this.chunkManager.getHeightAt(x, z)
      const ground = this.chunkManager.getBlock(x, y - 1, z)

      if (y <= 63 || ground === BlockType.AIR || ground === BlockType.WATER) continue
      if (this.chunkManager.getBlock(x, y, z) !== BlockType.AIR) continue
      if (this.chunkManager.getBlock(x, y + 1, z) !== BlockType.AIR) continue
      return new THREE.Vector3(x + 0.5, y + 0.05, z + 0.5)
    }
    return null
  }

  private spawnAnimal(): void {
    const position = this.findCreatureSpawn()
    if (!position) return
    const kinds: AnimalKind[] = ['cow', 'pig', 'sheep']
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const animal = new Animal(`animal-${this.nextEntityId++}`, kind)
    animal.position.copy(position)
    animal.setHome(position)
    animal.setChunkManager(this.chunkManager)
    this.entityManager.addEntity(animal)
  }

  private spawnZombie(): void {
    const position = this.findCreatureSpawn()
    if (!position) return
    const zombie = new Zombie(
      `zombie-${this.nextEntityId++}`,
      () => this.playerPosition.clone(),
      damage => this.applyDamage(damage, 'zombie'),
      () => this.gameMode === 'survival',
    )
    zombie.position.copy(position)
    zombie.setChunkManager(this.chunkManager)
    this.entityManager.addEntity(zombie)
  }

  private onResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.renderer.setSize(width, height)
    this.cameraManager.setAspect(width / height)
  }

  get fps(): number { return this.gameLoop.fps }
  get worldSeed(): number { return this.seed }

  /**
   * Respawn player after death
   */
  async respawn(): Promise<void> {
    if (!this.isDead || this.isRespawning) return
    this.isRespawning = true

    const deathPosition = this.playerPosition.clone()
    const safeSpawn = this.findSafeSpawn(deathPosition.x, deathPosition.z, 96, 320)
    const spawnX = safeSpawn.x
    const spawnZ = safeSpawn.z

    await this.chunkManager.updateChunks(
      Math.floor(spawnX / 16),
      Math.floor(spawnZ / 16),
    )
    const spawnY = this.chunkManager.getHeightAt(spawnX, spawnZ)

    this.playerPosition.set(spawnX + 0.5, spawnY + 0.2, spawnZ + 0.5)
    this.playerVelocity.set(0, 0, 0)
    this.isDead = false
    this.isRespawning = false
    this.fallStartY = this.playerPosition.y
    this.wasInAir = false

    // Reset health and oxygen
    const pStore = usePlayerStore()
    pStore.health = pStore.maxHealth
    pStore.isDead = false
    this.oxygen = this.maxOxygen
    pStore.oxygen = this.oxygen

    // Reset game mode to survival
    this.gameMode = 'survival'
    pStore.gameMode = 'survival'
    this.isFlying = false
    pStore.isFlying = false

    // Reset timers
    this.healthRegenTimer = 0
    this.lastDamageTime = 0

    this.eventBus.emit('player:respawned', {})
  }

  private findSafeSpawn(centerX: number, centerZ: number, minDistance: number, maxDistance: number): { x: number; z: number } {
    const tryCandidate = (x: number, z: number, requirePlains: boolean) => {
      const height = this.worldGenerator.getHeight(x, z)
      const biome = this.worldGenerator.getBiome(x, z)
      // 超平坦模式高度为 3, 正常模式需要 > 63
      const minHeight = this.superflat ? 2 : 63
      return height > minHeight && biome !== 'ocean' && biome !== 'beach' && (!requirePlains || biome === 'plains')
    }

    for (const requirePlains of [true, false]) {
      for (let attempt = 0; attempt < 160; attempt++) {
        const angle = Math.random() * Math.PI * 2
        const distance = minDistance + Math.random() * Math.max(1, maxDistance - minDistance)
        const x = Math.floor(centerX + Math.cos(angle) * distance)
        const z = Math.floor(centerZ + Math.sin(angle) * distance)
        if (tryCandidate(x, z, requirePlains)) return { x, z }
      }
    }

    // Deterministic fallback guarantees that an unlucky random search never leaves
    // the player at an underwater default coordinate.
    for (let radius = Math.max(16, minDistance); radius <= 1024; radius += 16) {
      for (let offset = -radius; offset <= radius; offset += 16) {
        for (const [dx, dz] of [[offset, -radius], [offset, radius], [-radius, offset], [radius, offset]]) {
          const x = Math.floor(centerX + dx)
          const z = Math.floor(centerZ + dz)
          if (tryCandidate(x, z, false)) return { x, z }
        }
      }
    }
    return { x: Math.floor(centerX), z: Math.floor(centerZ) }
  }

  dispose(): void {
    this.gameLoop.stop()
    this.stopBreaking()
    this.blockInteraction.dispose()
    this.redstoneSystem.dispose()
    this.entityManager.dispose()
    this.sky.dispose()
    this.renderer.dispose()
    this.textureAtlas.dispose()
    this.chunkManager.dispose()
  }
}
