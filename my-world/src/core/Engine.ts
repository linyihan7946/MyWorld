import * as THREE from 'three'
import { EventBus } from './EventBus'
import { GameLoop } from './GameLoop'
import { CameraManager } from '@/rendering/Camera'
import { TextureAtlas } from '@/rendering/TextureAtlas'
import { ChunkMesher } from '@/rendering/ChunkMesher'
import { Sky } from '@/rendering/Sky'
import { CloudSystem } from '@/rendering/CloudSystem'
import { WeatherSystem, type WeatherType } from '@/rendering/WeatherSystem'
import { WeatherAudio } from '@/rendering/WeatherAudio'
import { GameAudio } from '@/rendering/GameAudio'
import { BrewingSystem } from '@/gameplay/BrewingSystem'
import { potionEffects } from '@/gameplay/PotionEffect'
import { playerStats, updateHunger, exhaustJump, exhaustMine, exhaustDamage, tryEatFood, addExperience, resetPlayerStats } from '@/gameplay/PlayerStats'
import { InputManager } from '@/input/InputManager'
import { WorldGenerator } from '@/world/WorldGenerator'
import { ChunkManager } from '@/world/ChunkManager'
import { PhysicsEngine } from '@/physics/PhysicsEngine'
import { BlockInteraction } from '@/gameplay/BlockInteraction'
import { RedstoneSystem } from '@/gameplay/RedstoneSystem'
import { SaveSystem } from '@/gameplay/SaveSystem'
import { BlockType, BLOCK_REGISTRY } from '@/types/blocks'
import { PLAYER_SPEED, PLAYER_SPRINT_SPEED, JUMP_VELOCITY, MOUSE_SENSITIVITY, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, RENDER_DISTANCE } from '@/utils/constants'
import { useInventoryStore } from '@/ui/stores/inventoryStore'
import { usePlayerStore } from '@/ui/stores/playerStore'
import { ITEM_REGISTRY, getItemDefinition } from '@/types/items'
import { EntityManager } from '@/entities/EntityManager'
import { Animal, type AnimalKind } from '@/entities/characters/Animal'
import { Zombie } from '@/entities/characters/Zombie'
import { Steve } from '@/entities/characters/Steve'
import { DroppedItem } from '@/entities/DroppedItem'
import { useContainerStore } from '@/ui/stores/containerStore'
import { useFurnaceStore } from '@/ui/stores/furnaceStore'
import { useUIStore } from '@/ui/stores/uiStore'
import {
  debugStickUse, toggleLightBlock, isDebuggable,
  getCommand, setCommand, isCommandAlwaysOn, isCommandConditional,
  executeCommand, getLightLevel, setBlockState, getBlockStateValue
} from '@/gameplay/BlockStateSystem'
import { getEnchantLevel } from '@/gameplay/EnchantmentSystem'
import { PortalSystem, type Dimension } from '@/gameplay/PortalSystem'
import { BIOMES } from '@/world/BiomeRegistry'

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
  hopper: BlockType.HOPPER, redstone_torch: BlockType.REDSTONE_TORCH,

  // Doors & trapdoors
  oak_door: BlockType.OAK_DOOR, spruce_door: BlockType.SPRUCE_DOOR,
  birch_door: BlockType.BIRCH_DOOR, jungle_door: BlockType.JUNGLE_DOOR,
  acacia_door: BlockType.ACACIA_DOOR, dark_oak_door: BlockType.DARK_OAK_DOOR,
  iron_door: BlockType.IRON_DOOR, oak_trapdoor: BlockType.OAK_TRAPDOOR,
  spruce_trapdoor: BlockType.SPRUCE_TRAPDOOR, birch_trapdoor: BlockType.BIRCH_TRAPDOOR,
  jungle_trapdoor: BlockType.JUNGLE_TRAPDOOR, acacia_trapdoor: BlockType.ACACIA_TRAPDOOR,
  dark_oak_trapdoor: BlockType.DARK_OAK_TRAPDOOR, iron_trapdoor: BlockType.IRON_TRAPDOOR,

  // Buttons & pressure plates
  oak_button: BlockType.OAK_BUTTON, stone_button: BlockType.STONE_BUTTON,
  oak_pressure_plate: BlockType.OAK_PRESSURE_PLATE, stone_pressure_plate: BlockType.STONE_PRESSURE_PLATE,
  light_weighted_pressure_plate: BlockType.LIGHT_WEIGHTED_PRESSURE_PLATE,
  heavy_weighted_pressure_plate: BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE,

  // Rails
  rail: BlockType.RAIL, powered_rail: BlockType.POWERED_RAIL,
  detector_rail: BlockType.DETECTOR_RAIL, activator_rail: BlockType.ACTIVATOR_RAIL,

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

  // === 指令专属方块 ===
  command_block: BlockType.COMMAND_BLOCK,
  chain_command_block: BlockType.CHAIN_COMMAND_BLOCK,
  repeat_command_block: BlockType.REPEAT_COMMAND_BLOCK,
  barrier: BlockType.BARRIER,
  structure_block: BlockType.STRUCTURE_BLOCK,
  jigsaw_block: BlockType.JIGSAW_BLOCK,
  light_block: BlockType.LIGHT_BLOCK,
  structure_void: BlockType.STRUCTURE_VOID,
  steel_ore: BlockType.STEEL_ORE,
  steel_block: BlockType.STEEL_BLOCK,
  lever: BlockType.LEVER,
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
  steel_ingot: BlockType.STEEL_BLOCK, steel_ore: BlockType.STEEL_ORE,
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
  steel_pickaxe: BlockType.STEEL_BLOCK,
  wooden_axe: BlockType.OAK_PLANKS, stone_axe: BlockType.COBBLESTONE,
  iron_axe: BlockType.IRON_BLOCK, gold_axe: BlockType.GOLD_BLOCK,
  diamond_axe: BlockType.DIAMOND_BLOCK, netherite_axe: BlockType.NETHERITE_BLOCK,
  steel_axe: BlockType.STEEL_BLOCK,
  wooden_shovel: BlockType.OAK_PLANKS, stone_shovel: BlockType.COBBLESTONE,
  iron_shovel: BlockType.IRON_BLOCK, gold_shovel: BlockType.GOLD_BLOCK,
  diamond_shovel: BlockType.DIAMOND_BLOCK, netherite_shovel: BlockType.NETHERITE_BLOCK,
  steel_shovel: BlockType.STEEL_BLOCK,
  wooden_hoe: BlockType.OAK_PLANKS, stone_hoe: BlockType.COBBLESTONE,
  iron_hoe: BlockType.IRON_BLOCK, gold_hoe: BlockType.GOLD_BLOCK,
  diamond_hoe: BlockType.DIAMOND_BLOCK, netherite_hoe: BlockType.NETHERITE_BLOCK,
  steel_hoe: BlockType.STEEL_BLOCK,
  // 武器
  wooden_sword: BlockType.OAK_PLANKS, stone_sword: BlockType.COBBLESTONE,
  iron_sword: BlockType.IRON_BLOCK, gold_sword: BlockType.GOLD_BLOCK,
  diamond_sword: BlockType.DIAMOND_BLOCK, netherite_sword: BlockType.NETHERITE_BLOCK,
  steel_sword: BlockType.STEEL_BLOCK,
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
  steel_helmet: BlockType.STEEL_BLOCK, steel_chestplate: BlockType.STEEL_BLOCK,
  steel_leggings: BlockType.STEEL_BLOCK, steel_boots: BlockType.STEEL_BLOCK,
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
  [BlockType.HOPPER]: 'hopper', [BlockType.LEVER]: 'lever',
  [BlockType.LEVER_ON]: 'lever',
  [BlockType.REDSTONE_TORCH]: 'redstone_torch', [BlockType.REDSTONE_TORCH_ON]: 'redstone_torch',
  // Doors & trapdoors
  [BlockType.OAK_DOOR]: 'oak_door', [BlockType.SPRUCE_DOOR]: 'spruce_door',
  [BlockType.BIRCH_DOOR]: 'birch_door', [BlockType.JUNGLE_DOOR]: 'jungle_door',
  [BlockType.ACACIA_DOOR]: 'acacia_door', [BlockType.DARK_OAK_DOOR]: 'dark_oak_door',
  [BlockType.IRON_DOOR]: 'iron_door', [BlockType.OAK_TRAPDOOR]: 'oak_trapdoor',
  [BlockType.SPRUCE_TRAPDOOR]: 'spruce_trapdoor', [BlockType.BIRCH_TRAPDOOR]: 'birch_trapdoor',
  [BlockType.JUNGLE_TRAPDOOR]: 'jungle_trapdoor', [BlockType.ACACIA_TRAPDOOR]: 'acacia_trapdoor',
  [BlockType.DARK_OAK_TRAPDOOR]: 'dark_oak_trapdoor', [BlockType.IRON_TRAPDOOR]: 'iron_trapdoor',
  // Buttons & pressure plates
  [BlockType.OAK_BUTTON]: 'oak_button', [BlockType.STONE_BUTTON]: 'stone_button',
  [BlockType.OAK_PRESSURE_PLATE]: 'oak_pressure_plate', [BlockType.STONE_PRESSURE_PLATE]: 'stone_pressure_plate',
  [BlockType.LIGHT_WEIGHTED_PRESSURE_PLATE]: 'light_weighted_pressure_plate',
  [BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE]: 'heavy_weighted_pressure_plate',
  // Rails
  [BlockType.RAIL]: 'rail', [BlockType.POWERED_RAIL]: 'powered_rail',
  [BlockType.DETECTOR_RAIL]: 'detector_rail', [BlockType.ACTIVATOR_RAIL]: 'activator_rail',
  // Ores
  [BlockType.COAL_ORE]: 'coal', [BlockType.IRON_ORE]: 'iron_ingot',
  [BlockType.GOLD_ORE]: 'gold_ingot', [BlockType.DIAMOND_ORE]: 'diamond',
  [BlockType.EMERALD_ORE]: 'emerald', [BlockType.REDSTONE_ORE]: 'redstone_dust',
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
  // 指令专属方块
  [BlockType.COMMAND_BLOCK]: 'command_block', [BlockType.CHAIN_COMMAND_BLOCK]: 'chain_command_block',
  [BlockType.REPEAT_COMMAND_BLOCK]: 'repeat_command_block', [BlockType.BARRIER]: 'barrier',
  [BlockType.STRUCTURE_BLOCK]: 'structure_block', [BlockType.JIGSAW_BLOCK]: 'jigsaw_block',
  [BlockType.LIGHT_BLOCK]: 'light_block', [BlockType.STRUCTURE_VOID]: 'structure_void',
  [BlockType.STEEL_ORE]: 'steel_ingot', [BlockType.STEEL_BLOCK]: 'steel_block',
}

/** 获取物品的显示方块类型（用于 HUD 颜色） */
function getItemDisplayBlock(itemId: string): BlockType {
  return ITEM_TO_BLOCK[itemId] ?? ITEM_DISPLAY_BLOCK[itemId] ?? BlockType.AIR
}

export class Engine {
  // 静态缓存：复用 Color/Vector3 对象，避免每帧 GC 分配
  private static readonly _nightSky = new THREE.Color(0x071020)
  private static readonly _daySky = new THREE.Color(0x87ceeb)
  private static readonly _rainSky = new THREE.Color(0x2a3a4a)
  private static readonly _snowSky = new THREE.Color(0xbcc8d4)
  private static readonly _thunderSky = new THREE.Color(0x0c1018)
  private static readonly _sandSky = new THREE.Color(0xc4a060)
  private static readonly _fogSky = new THREE.Color(0xa0aab4)
  private static readonly _tmpColor1 = new THREE.Color()
  private static readonly _tmpColor2 = new THREE.Color()
  private static readonly _tmpColor3 = new THREE.Color()
  private static readonly _tmpColor4 = new THREE.Color()
  private static readonly _sunDir = new THREE.Vector3()

  public eventBus: EventBus
  public gameLoop: GameLoop
  public inputManager: InputManager

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  public cameraManager!: CameraManager
  private textureAtlas!: TextureAtlas
  private chunkMesher!: ChunkMesher
  private sky!: Sky
  private cloudSystem!: CloudSystem
  private weatherSystem!: WeatherSystem
  private weatherAudio!: WeatherAudio
  private gameAudio!: GameAudio

  private worldGenerator!: WorldGenerator
  private chunkManager!: ChunkManager
  private physicsEngine!: PhysicsEngine
  private blockInteraction!: BlockInteraction
  private redstoneSystem!: RedstoneSystem
  private entityManager!: EntityManager
  private portalSystem!: PortalSystem
  private playerEntity!: Steve
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
  private autoSaveInterval: number | null = null

  // === Dropped items ===
  private droppedItems: DroppedItem[] = []
  private droppedItemIdCounter = 0

  // === NEW: Game mode ===
  private gameMode: 'survival' | 'creative' = 'survival' // default survival
  private isFlying = false
  private lastSpaceTap = 0
  private flySpeed = 10

  // === NEW: Fall damage ===
  private fallStartY = 0
  private wasInAir = false
  private footstepAccum = 0 // 步声音效节流

  // === NEW: 屏障方块可见性追踪 ===
  private wasHoldingBarrier = false
  private hadFullSteelArmor = false

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
  private isTeleporting = false  // 防止传送期间重复触发
  private healthRegenTimer = 0     // accumulator for health regeneration (seconds)
  private lastDamageTime = 0       // timestamp of last damage taken

  // Day/night and creature spawning
  private timeOfDay = 0.4
  private readonly dayLengthSeconds = 480
  private daylight = 1
  private mobSpawnTimer = 0
  private weatherTimer = 60 // seconds until next auto-weather change
  private nextEntityId = 1

  // === 功能方块状态 ===
  /** 睡觉状态: 渐黑 → 跳到早上 → 渐亮 */
  private sleeping = false
  private sleepPhase = 0
  private sleepBedPos = new THREE.Vector3()
  /** 点燃的 TNT: "x,y,z" → 剩余引信秒数 */
  private tntFuses = new Map<string, { x: number; y: number; z: number; fuse: number }>()
  /** 玩家当前踩着的压力板位置（离开时释放信号） */
  private lastPlatePos: { x: number; y: number; z: number } | null = null
  private isRespawning = false

  // 性能优化：节流计数器
  private frameCount = 0
  private lightUpdateAccum = 0
  private biomeAccum = 0
  private posAccum = 0
  private lastChunkX = -9999
  private lastChunkZ = -9999

  // 缓存 Vector3 对象，避免每帧 GC 分配（hot path: update movement）
  private static readonly _movFwd = new THREE.Vector3()
  private static readonly _movRight = new THREE.Vector3()
  private static readonly _movDir = new THREE.Vector3()

  private container: HTMLElement
  private seed: number
  private superflat: boolean
  private isTouchDevice = false

  // === 调试渲染: 区块边界 & 碰撞箱 ===
  private chunkBorderGrid: THREE.LineSegments | null = null
  private entityHitboxes = new Map<string, THREE.LineSegments>()

  constructor(container: HTMLElement, seed?: number, superflat = false) {
    this.container = container
    this.seed = seed ?? Math.floor(Math.random() * 2147483647)
    this.superflat = superflat
    // 仅真正的触摸屏设备才识别为手机（precision touchpad 不算）
    this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    this.eventBus = new EventBus()
    this.gameLoop = new GameLoop() // 跟随显示器刷新率，不限制帧率
    this.inputManager = new InputManager()
  }

  async init(): Promise<void> {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // 全平台开启抗锯齿
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    // PC 最高 3x 像素比（Retina 清晰），手机最高 2x
    this.renderer.setPixelRatio(this.isTouchDevice ? Math.min(window.devicePixelRatio, 2) : Math.min(window.devicePixelRatio, 3))
    this.renderer.setClearColor(0x87CEEB)
    this.renderer.shadowMap.enabled = true
    // 全平台使用柔和阴影
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()

    this.cameraManager = new CameraManager(window.innerWidth / window.innerHeight)
    this.cameraManager.setTargetPosition(this.playerPosition)

    this.textureAtlas = new TextureAtlas()
    this.chunkMesher = new ChunkMesher(this.textureAtlas)

    this.sky = new Sky()
    this.scene.add(this.sky.mesh)

    this.cloudSystem = new CloudSystem()
    this.scene.add(this.cloudSystem.mesh)

    this.weatherSystem = new WeatherSystem()
    this.weatherSystem.addToScene(this.scene)

    this.weatherAudio = new WeatherAudio()
    this.gameAudio = new GameAudio()
    this.weatherSystem.onThunder = (loudness) => this.weatherAudio.triggerThunder(loudness)
    this.weatherSystem.getGroundHeight = (x, z) => this.chunkManager.getHeightAt(x, z)
    this.weatherSystem.getPlayerPos = () => this.playerPosition.clone()
    this.weatherSystem.onLightningStrike = (pos) => {
      // If player is within 2.5 blocks of the strike, they die instantly
      const dx = this.playerPosition.x - pos.x
      const dy = this.playerPosition.y - pos.y
      const dz = this.playerPosition.z - pos.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < 2.5 && this.gameMode === 'survival') {
        const pStore = usePlayerStore()
        pStore.health = 0
        this.isDead = true
        pStore.isDead = true
        pStore.deathCount++
        const inv = useInventoryStore()
        inv.setSurvivalInventory()
        this.eventBus.emit('player:died', { deathCount: pStore.deathCount, cause: 'lightning' })
      }
    }

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambientLight)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.sunLight.position.set(50, 100, 30)
    this.sunLight.castShadow = true
    this.sunLight.shadow.mapSize.set(this.isTouchDevice ? 1024 : 2048, this.isTouchDevice ? 1024 : 2048)
    this.sunLight.shadow.camera.left = -32
    this.sunLight.shadow.camera.right = 32
    this.sunLight.shadow.camera.top = 32
    this.sunLight.shadow.camera.bottom = -32
    this.sunLight.shadow.camera.near = 1
    this.sunLight.shadow.camera.far = 256
    this.sunLight.shadow.bias = -0.00015
    this.sunLight.shadow.normalBias = 0.02
    this.scene.add(this.sunLight)
    this.scene.add(this.sunLight.target)

    // Underwater overlay (fullscreen quad rendered by UI, we track state)
    this.isUnderwater = false

    this.inputManager.attach(this.renderer.domElement, this.isTouchDevice)

    // Init audio on first pointer lock (browser requires user gesture)
    this.inputManager.onPointerLockChange = (locked) => {
      if (locked) {
        this.weatherAudio.init()
        this.gameAudio.init()
      }
    }

    // 药水瞬间效果回调
    potionEffects.onInstantEffect = (id, level) => {
      if (id === 'instant_health') {
        const p = usePlayerStore()
        p.health = Math.min(p.maxHealth, p.health + level * 4)
      } else if (id === 'instant_damage') {
        this.applyDamage(level * 3, 'magic')
      } else if (id === 'saturation') {
        // 饱和恢复饥饿值
      }
    }

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
    this.portalSystem = new PortalSystem(this.chunkManager)

    // Create player model (visible only in third-person)
    this.playerEntity = new Steve('player')
    this.playerEntity.mesh.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    this.playerEntity.mesh.visible = false // hidden in first-person by default
    this.scene.add(this.playerEntity.mesh)

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
    // 新游戏重置玩家状态（饥饿/经验）
    resetPlayerStats()

    window.addEventListener('resize', () => this.onResize())

    // 注册存档回调到 playerStore
    const pStoreInit = usePlayerStore()
    pStoreInit.saveCallback = () => this.saveGame()

    this.gameLoop.start(
      (dt) => this.update(dt),
      (dt) => this.render(dt),
    )
  }

  private xHeld = false

  /** 游戏快捷键仅在指针锁定时生效；解锁后交还系统/浏览器 */
  private get shortcutsEnabled(): boolean {
    return this.inputManager.locked
  }

  private setupInputHandlers(): void {
    this.inputManager.onKeyDown = (key: string) => {
      const ui = useUIStore()
      const pStore = usePlayerStore()
      const locked = this.shortcutsEnabled

      // ── 始终可用 ──
      // Escape: 退出锁定 / 关闭界面
      if (key === 'Escape') {
        const inv = useInventoryStore()
        if (inv.showInventory) {
          inv.showInventory = false
          ui.closeAll()
          return
        }
        if (document.pointerLockElement) {
          document.exitPointerLock()
        } else if (!this.isTouchDevice) {
          this.renderer.domElement.requestPointerLock()
        }
        return
      }

      // E: 打开背包（同时解锁鼠标）
      if (key === 'KeyE') {
        if (document.pointerLockElement) document.exitPointerLock()
        return
      }

      // 1-9: 热键栏（始终可用，无需锁定）
      if (key >= 'Digit1' && key <= 'Digit9') {
        const slot = parseInt(key.replace('Digit', '')) - 1
        useInventoryStore().selectSlot(slot)
        pStore.selectedSlot = slot
        this.eventBus.emit('hotbar:select', slot)
        return
      }

      // ── 以下快捷键仅在指针锁定时生效 ──
      if (!locked) return

      // X 组合键追踪
      if (key === 'KeyX') { this.xHeld = true; return }

      if (this.xHeld) {
        if (key === 'KeyA') {
          this.chunkManager.markAllDirty()
          pStore.breakToolName = '§a区块已刷新'
          setTimeout(() => { pStore.breakToolName = null }, 2000)
          this.xHeld = false; return
        }
        if (key === 'KeyB') {
          ui.showHitboxes = !ui.showHitboxes
          pStore.breakToolName = `碰撞箱: ${ui.showHitboxes ? '§a显示' : '§c隐藏'}`
          setTimeout(() => { pStore.breakToolName = null }, 2000)
          this.xHeld = false; return
        }
        if (key === 'KeyC') {
          ui.showChunkBorders = !ui.showChunkBorders
          pStore.breakToolName = `区块边界: ${ui.showChunkBorders ? '§a显示' : '§c隐藏'}`
          setTimeout(() => { pStore.breakToolName = null }, 2000)
          this.xHeld = false; return
        }
        if (key === 'KeyT') {
          ui.showAdvancedTooltips = !ui.showAdvancedTooltips
          pStore.breakToolName = `高级提示: ${ui.showAdvancedTooltips ? '§a显示' : '§c隐藏'}`
          setTimeout(() => { pStore.breakToolName = null }, 2000)
          this.xHeld = false; return
        }
        this.xHeld = false
      }

      if (key === 'KeyZ') {
        ui.showHUD = !ui.showHUD
        return
      }

      if (key === 'KeyV') this.cameraManager.toggleMode()

      if (key === 'KeyP') {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
        return
      }

      if (key === 'KeyH') {
        const saved = this.saveGame()
        pStore.breakToolName = saved ? '✓ 已保存' : '✗ 保存失败'
        setTimeout(() => { pStore.breakToolName = null }, 2000)
      }

      if (key === 'KeyG') {
        this.toggleGameMode()
      }

      if (key === 'KeyR') {
        pStore.toggleControlMode()
        const modeLabel = pStore.controlMode === 'mobile' ? '📱 手机模式' : '🖥 PC模式'
        pStore.breakToolName = modeLabel
        setTimeout(() => { pStore.breakToolName = null }, 2000)
      }

      if (key === 'KeyY') {
        if (this.gameMode === 'creative') {
          this.cycleWeather()
        } else {
          pStore.breakToolName = '需要创造模式'
          setTimeout(() => { pStore.breakToolName = null }, 2000)
        }
      }

      if (key === 'KeyF') {
        pStore.toggleCheats()
        const status = pStore.cheatsEnabled ? '开启' : '关闭'
        pStore.breakToolName = `作弊: ${status}`
        setTimeout(() => { pStore.breakToolName = null }, 2000)
      }

      if (key === 'KeyQ') {
        this.dropSelectedItem()
        return
      }

      if (key === 'Space') {
        if (this.gameMode === 'creative') {
          const now = performance.now()
          if (now - this.lastSpaceTap < 300) {
            this.isFlying = !this.isFlying
            if (this.isFlying) this.playerVelocity.y = 0
            this.eventBus.emit('game:flyingChanged', this.isFlying)
            pStore.isFlying = this.isFlying
          }
          this.lastSpaceTap = now
        }
      }
    }

    this.inputManager.onKeyUp = (key: string) => {
      if (key === 'KeyX') {
        // X 单独按下（无组合键）→ 切换调试屏幕
        if (this.xHeld) {
          const ui = useUIStore()
          ui.showDebug = !ui.showDebug
          const pStore = usePlayerStore()
          pStore.breakToolName = `调试: ${ui.showDebug ? '§a显示' : '§c隐藏'}`
          setTimeout(() => { pStore.breakToolName = null }, 2000)
        }
        this.xHeld = false
      }
    }

    this.inputManager.onMouseMove = (dx: number, dy: number) => {
      this.yaw -= dx * MOUSE_SENSITIVITY
      this.pitch -= dy * MOUSE_SENSITIVITY
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))
      this.cameraManager.setRotation(this.yaw, this.pitch)
    }

    this.inputManager.onMouseDown = (button: number) => {
      // 触摸设备 或 pointer lock 已激活时允许操作
      const actionAllowed = this.isTouchDevice || this.inputManager.locked
      if (!actionAllowed) {
        // PC 首次点击：请求 pointer lock，不执行动作（避免第一次点击就挖/放）
        this.renderer.domElement.requestPointerLock()
        return
      }

      if (button === 0) {
        // 左键: 检查调试棒 -> 攻击实体 -> 挖方块
        const inv = useInventoryStore()
        const selectedSlot = inv.hotbar[inv.selectedSlot]
        if (selectedSlot?.item === 'debug_stick') {
          this.useDebugStickOnTarget()
          return
        }
        if (!this.attackEntity()) {
          this.isBreaking = true
          this.startBreaking()
        }
      } else if (button === 2) {
        const forcePlace = this.inputManager.isKeyPressed('ShiftLeft') || this.inputManager.isKeyPressed('ShiftRight')
        // 右键: 调试棒交互 -> 光源方块切换 -> 命令方块编辑 -> 结构/拼图方块 -> 容器 -> 吃食物 -> 放方块
        const inv = useInventoryStore()
        const selectedSlot = inv.hotbar[inv.selectedSlot]
        if (!forcePlace && selectedSlot?.item === 'debug_stick') {
          this.useDebugStickOnTarget()
          return
        }
        if (!forcePlace && this.handleSpecialInteraction()) {
          return
        }
        if (!forcePlace && this.openTargetContainer()) {
          return
        }
        if (!this.equipArmor()) {
          if (!this.drinkPotion()) {
            if (!this.eatFood()) {
              // 传送门激活（打火石/末影之眼 → 尝试激活传送门）
              if (!forcePlace && this.tryActivatePortalOnTarget()) {
                return
              }
              this.placeBlock()
            }
          }
        }
      }
    }

    this.inputManager.onMouseUp = (button: number) => {
      if (button === 0) {
        this.isBreaking = false
        this.stopBreaking()
        // 即时清除 HUD 挖掘进度
        const pStore = usePlayerStore()
        pStore.breakProgress = 0
        pStore.breakToolName = null
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

      // 熔炉被破坏时掉落内容物
      if (data.blockType === BlockType.FURNACE || data.blockType === BlockType.BLAST_FURNACE || data.blockType === BlockType.SMOKER) {
        const contents = useFurnaceStore().removeFurnace(data.position.x, data.position.y, data.position.z)
        const inventory = useInventoryStore()
        for (const slot of contents) {
          if (slot.item) inventory.addItem(slot.item, slot.count, slot.blockType)
        }
      }

      // TNT 在引信燃烧期间被破坏则取消爆炸
      if (data.blockType === BlockType.TNT) {
        this.tntFuses.delete(`${data.position.x},${data.position.y},${data.position.z}`)
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

      // 方块破坏音效
      this.gameAudio.playBlockBreak(this.getBlockSoundType(data.blockType))
      // 饥饿消耗
      exhaustMine()
      // 矿物经验掉落 (MC 1:1)
      const xpDrops: Record<number, number> = {
        [BlockType.COAL_ORE]: 0.5, [BlockType.IRON_ORE]: 0, [BlockType.GOLD_ORE]: 0,
        [BlockType.DIAMOND_ORE]: 3.5, [BlockType.EMERALD_ORE]: 3.5,
        [BlockType.LAPIS_ORE]: 2, [BlockType.REDSTONE_ORE]: 2,
        [BlockType.NETHER_QUARTZ_ORE]: 2.5,
      }
      const xp = xpDrops[data.blockType]
      if (xp) addExperience(xp)
    })
  }

  private toggleGameMode(): void {
    const inv = useInventoryStore()
    if (this.gameMode === 'survival') {
      // 从生存切换到创造：保存生存物品栏
      inv.saveSurvivalInventory()
      this.gameMode = 'creative'
      inv.setCreativeInventory()
    } else {
      // 从创造切换到生存：恢复之前保存的物品栏
      this.gameMode = 'survival'
      this.isFlying = false
      inv.restoreSurvivalInventory()
    }
    const pStore = usePlayerStore()
    pStore.gameMode = this.gameMode
    pStore.isFlying = this.isFlying
    this.eventBus.emit('game:modeChanged', this.gameMode)
  }

  /** 循环切换天气 */
  private cycleWeather(): void {
    // 随机天气，不按顺序循环
    const types: WeatherType[] = ['clear', 'rain', 'drizzle', 'snow', 'blizzard', 'thunder', 'sandstorm', 'foggy']
    let next: WeatherType
    do {
      next = types[Math.floor(Math.random() * types.length)]
    } while (next === this.weatherSystem.target && types.length > 1)
    this.weatherSystem.request(next)
    const pStore = usePlayerStore()
    pStore.weather = next
    const names: Record<string, string> = {
      clear: '☀ 晴天', rain: '🌧 雨天', drizzle: '🌦 毛毛雨',
      snow: '❄ 雪天', blizzard: '🌨 暴风雪', thunder: '⛈ 雷暴',
      sandstorm: '🏜 沙尘暴', foggy: '🌫 浓雾',
    }
    pStore.breakToolName = names[next] ?? next
    setTimeout(() => { pStore.breakToolName = null }, 2000)
  }

  /** 公开方法：设置游戏模式 */
  setGameMode(mode: 'survival' | 'creative'): void {
    if (this.gameMode === mode) return
    const inv = useInventoryStore()
    if (mode === 'creative') {
      inv.saveSurvivalInventory()
      this.gameMode = 'creative'
      inv.setCreativeInventory()
    } else {
      this.gameMode = 'survival'
      this.isFlying = false
      inv.restoreSurvivalInventory()
    }
    const pStore = usePlayerStore()
    pStore.gameMode = this.gameMode
    pStore.isFlying = this.isFlying
    this.eventBus.emit('game:modeChanged', this.gameMode)
  }

  private startBreaking(): void {
    if (this.breakInterval) return
    const isCreative = this.gameMode === 'creative'
    const interval = isCreative ? 20 : 50

    this.breakInterval = window.setInterval(() => {
      if (!this.isBreaking) {
        this.stopBreaking()
        usePlayerStore().breakProgress = 0
        usePlayerStore().breakToolName = null
        return
      }
      // 指令专属方块检查：非创造+作弊模式不可破坏
      const targetBlock = this.blockInteraction.getTargetBlock()
      if (targetBlock) {
        const tDef = BLOCK_REGISTRY[targetBlock.blockType]
        if (tDef?.commandExclusive && !usePlayerStore().canUseCommandBlocks) {
          usePlayerStore().breakProgress = 0
          usePlayerStore().breakToolName = '需要创造模式+作弊'
          return
        }
      }
      // 创造模式快速但不瞬间破坏（isCreative 参数传给 breakHit 用于加成）
      const result = this.blockInteraction.breakHit(false, isCreative)

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

  /** 右键穿盔甲，返回是否成功 */
  private equipArmor(): boolean {
    if (this.gameMode !== 'survival') return false
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot?.item) return false
    if (inv.equipArmor(slot.item)) {
      slot.count--
      if (slot.count <= 0) {
        slot.item = null
        slot.blockType = undefined
      }
      return true
    }
    return false
  }

  /** 右键喝药水，返回是否成功 */
  private drinkPotion(): boolean {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot?.item) return false
    const isSplash = slot.item.startsWith('splash_')
    if (BrewingSystem.drinkPotion(slot.item, isSplash)) {
      if (isSplash) {
        // 喷溅药水：对自己使用后再显示效果
      }
      slot.count--
      if (slot.count <= 0) { slot.item = null; slot.count = 0 }
      return true
    }
    return false
  }

  /** 右键吃食物，返回是否成功 */
  private eatFood(): boolean {
    if (this.gameMode !== 'survival') return false
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot?.item) return false
    if (tryEatFood(slot.item)) {
      slot.count--
      if (slot.count <= 0) { slot.item = null; slot.count = 0 }
      return true
    }
    return false
  }

  /** 左键攻击实体（动物/僵尸等），返回是否命中 */
  private attackEntity(): boolean {
    const camPos = this.cameraManager.activeCamera.position.clone()
    const camDir = this.cameraManager.getForwardDirection()

    // 射线检测 3 格内的实体
    const allEntities = this.entityManager.getAllEntities()
    let closestDist = 3.0
    let targetEntity: import('@/entities/Entity').Entity | null = null

    for (const entity of allEntities) {
      if (!entity.isAlive) continue
      const toEntity = entity.position.clone().sub(camPos)
      const dist = toEntity.length()
      if (dist > closestDist) continue
      // 简单的方向检测：实体是否在准星附近
      const dot = toEntity.normalize().dot(camDir)
      if (dot > 0.92) {
        closestDist = dist
        targetEntity = entity
      }
    }

    if (!targetEntity) return false

    // 计算伤害（空手 1，手持武器用武器伤害）
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    let damage = 1
    if (slot?.item) {
      const itemDef = getItemDefinition(slot.item)
      if (itemDef?.damage) damage = itemDef.damage
      // Sharpness enchantment: +1.25 damage per level
      const sharpLvl = getEnchantLevel(slot.enchantments, 'sharpness')
      if (sharpLvl > 0) damage += sharpLvl * 1.25
    }

    targetEntity.takeDamage(damage)

    // 击退
    const knockback = camDir.clone().setY(0.3).normalize().multiplyScalar(0.5)
    targetEntity.position.add(knockback)

    // 武器耐久消耗 (Unbreaking enchantment saves durability)
    if (slot?.item) {
      const itemDef = getItemDefinition(slot.item)
      if (itemDef?.durability) {
        const unbreakingLvl = getEnchantLevel(slot.enchantments, 'unbreaking')
        // Unbreaking: (100 / (level+1))% chance to consume durability
        const saveChance = unbreakingLvl / (unbreakingLvl + 1)
        if (Math.random() >= saveChance) {
          if (!slot.durabilityDamage) slot.durabilityDamage = 0
          slot.durabilityDamage++
        }
        if ((slot.durabilityDamage ?? 0) >= itemDef.durability) {
          slot.item = null
          slot.count = 0
          slot.durabilityDamage = 0
        }
      }
    }
    return true
  }

  private placeBlock(): void {
    const inv = useInventoryStore()
    const selectedSlot = inv.hotbar[inv.selectedSlot]

    // 没有选择任何方块时，不放置任何东西
    if (!selectedSlot?.item || !selectedSlot.blockType) return

    // 指令专属方块需要创造模式+作弊才能放置
    const blockDef = BLOCK_REGISTRY[selectedSlot.blockType]
    if (blockDef?.commandExclusive && !usePlayerStore().canUseCommandBlocks) {
      usePlayerStore().breakToolName = '需要创造模式+作弊'
      setTimeout(() => { usePlayerStore().breakToolName = null }, 2000)
      return
    }

    // Creative mode: always allow placing (infinite blocks)
    if (this.gameMode === 'creative') {
      const blockType = selectedSlot.blockType
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
    const halfWidth = PLAYER_WIDTH / 2
    const playerAABB = {
      minX: this.playerPosition.x - halfWidth, maxX: this.playerPosition.x + halfWidth,
      minY: this.playerPosition.y, maxY: this.playerPosition.y + PLAYER_HEIGHT,
      minZ: this.playerPosition.z - halfWidth, maxZ: this.playerPosition.z + halfWidth,
    }
    const placed = this.blockInteraction.placeBlock(selectedSlot.blockType, playerAABB)
    if (placed) {
      this.gameAudio.playBlockPlace(this.getBlockSoundType(selectedSlot.blockType))
      inv.removeFromSelected()
    }
  }

  // ==================== 调试棒交互 ====================

  private useDebugStickOnTarget(): void {
    const target = this.blockInteraction.getTargetBlock()
    if (!target) return

    const { position, blockType } = target
    const pStore = usePlayerStore()

    if (!pStore.canUseCommandBlocks) {
      pStore.breakToolName = '需要创造模式+作弊'
      setTimeout(() => { pStore.breakToolName = null }, 2000)
      return
    }

    const result = debugStickUse(position.x, position.y, position.z, blockType)
    if (result) {
      pStore.breakToolName = result.message
      setTimeout(() => { pStore.breakToolName = null }, 2000)
      // 触发区块更新
      this.chunkManager.markBlockDirty(position.x, position.y, position.z)
    } else {
      const blockDef = BLOCK_REGISTRY[blockType]
      pStore.breakToolName = `${blockDef?.name || '方块'} 无可调试属性`
      setTimeout(() => { pStore.breakToolName = null }, 2000)
    }
  }

  // ==================== 特殊方块交互 (右键) ====================

  private handleSpecialInteraction(): boolean {
    const target = this.blockInteraction.getTargetBlock()
    if (!target) return false

    const { position, blockType } = target
    const pStore = usePlayerStore()

    // 拉杆: 右键切换开关
    if (blockType === BlockType.LEVER || blockType === BlockType.LEVER_ON) {
      const isOn = blockType === BlockType.LEVER_ON
      this.chunkManager.setBlock(position.x, position.y, position.z, isOn ? BlockType.LEVER : BlockType.LEVER_ON)
      pStore.breakToolName = isOn ? '拉杆: 关闭' : '拉杆: 开启'
      setTimeout(() => { pStore.breakToolName = null }, 1500)
      return true
    }

    // 工作台: 打开3×3合成
    if (blockType === BlockType.CRAFTING_TABLE) {
      const ui = useUIStore()
      ui.showCrafting = true
      useInventoryStore().showInventory = true
      // 退出指针锁定，否则背包界面打开后鼠标仍被锁定无法点击
      if (document.pointerLockElement) document.exitPointerLock()
      return true
    }

    // 铁砧: 标记为铁砧交互
    if (blockType === BlockType.ANVIL) {
      const ui = useUIStore()
      ui.showAnvil = true
      ui.anvilX = position.x
      ui.anvilY = position.y
      ui.anvilZ = position.z
      // 铁砧叠加层在物品栏根节点内渲染，需要物品栏容器可见
      useInventoryStore().showInventory = true
      if (document.pointerLockElement) document.exitPointerLock()
      return true
    }

    // 熔炉/高炉/烟熏炉: 打开烧炼界面
    if (blockType === BlockType.FURNACE || blockType === BlockType.BLAST_FURNACE || blockType === BlockType.SMOKER) {
      useFurnaceStore().openFurnace(blockType, position.x, position.y, position.z)
      if (document.pointerLockElement) document.exitPointerLock()
      return true
    }

    // 床: 夜晚右键睡觉，跳到第二天早上
    if (blockType >= BlockType.WHITE_BED && blockType <= BlockType.BLACK_BED) {
      this.trySleepInBed(position)
      return true
    }

    // TNT: 手持打火石右键点燃
    if (blockType === BlockType.TNT) {
      const inv = useInventoryStore()
      if (inv.hotbar[inv.selectedSlot]?.item === 'flint_and_steel') {
        this.igniteTnt(position.x, position.y, position.z)
        return true
      }
      return false
    }

    // 门: 右键开关（铁门需要红石，不能手动）
    if (this.isDoorBlock(blockType)) {
      const isIron = blockType === BlockType.IRON_DOOR
      if (isIron) {
        pStore.breakToolName = '🔒 铁门只能被红石信号打开'
        setTimeout(() => { pStore.breakToolName = null }, 1500)
        return true
      }
      const isOpen = getBlockStateValue(position.x, position.y, position.z, 'open', false) as boolean
      setBlockState(position.x, position.y, position.z, { open: !isOpen })
      const half = getBlockStateValue(position.x, position.y, position.z, 'half', undefined)
      const linkedY = half === 'top' ? position.y - 1 : half === 'bottom' ? position.y + 1 : null
      if (linkedY !== null && this.chunkManager.getBlock(position.x, linkedY, position.z) === blockType) {
        setBlockState(position.x, linkedY, position.z, { open: !isOpen })
        this.chunkManager.markBlockDirty(position.x, linkedY, position.z)
      }
      pStore.breakToolName = isOpen ? '门: 已关闭' : '门: 已打开'
      setTimeout(() => { pStore.breakToolName = null }, 1500)
      this.chunkManager.markBlockDirty(position.x, position.y, position.z)
      return true
    }

    // 活板门: 右键开关（铁活板门需要红石）
    if (this.isTrapdoorBlock(blockType)) {
      const isIron = blockType === BlockType.IRON_TRAPDOOR
      if (isIron) {
        pStore.breakToolName = '🔒 铁活板门只能被红石信号打开'
        setTimeout(() => { pStore.breakToolName = null }, 1500)
        return true
      }
      const isOpen = getBlockStateValue(position.x, position.y, position.z, 'open', false) as boolean
      setBlockState(position.x, position.y, position.z, { open: !isOpen })
      pStore.breakToolName = isOpen ? '活板门: 已关闭' : '活板门: 已打开'
      setTimeout(() => { pStore.breakToolName = null }, 1500)
      this.chunkManager.markBlockDirty(position.x, position.y, position.z)
      return true
    }

    // 按钮: 按下输出短暂红石脉冲
    if (blockType === BlockType.OAK_BUTTON || blockType === BlockType.STONE_BUTTON) {
      setBlockState(position.x, position.y, position.z, { powered: true })
      pStore.breakToolName = '按钮: 按下'
      setTimeout(() => { pStore.breakToolName = null }, 1500)
      this.chunkManager.markBlockDirty(position.x, position.y, position.z)
      // 原版木质按钮约 1.5 秒弹起
      setTimeout(() => {
        setBlockState(position.x, position.y, position.z, { powered: false })
        this.chunkManager.markBlockDirty(position.x, position.y, position.z)
      }, 1500)
      return true
    }

    // 光源方块: 右键切换开关
    if (blockType === BlockType.LIGHT_BLOCK) {
      if (!pStore.canUseCommandBlocks) return false
      const isOn = toggleLightBlock(position.x, position.y, position.z)
      pStore.breakToolName = isOn ? '💡 光源开启' : '💡 光源关闭'
      setTimeout(() => { pStore.breakToolName = null }, 2000)
      this.chunkManager.markBlockDirty(position.x, position.y, position.z)
      return true
    }

    // 命令方块: 右键打开命令编辑器
    if (blockType === BlockType.COMMAND_BLOCK ||
        blockType === BlockType.CHAIN_COMMAND_BLOCK ||
        blockType === BlockType.REPEAT_COMMAND_BLOCK) {
      if (!pStore.canUseCommandBlocks) return false
      // 通过事件总线通知UI打开命令编辑框
      this.eventBus.emit('commandBlock:open', {
        x: position.x, y: position.y, z: position.z,
        blockType: blockType
      })
      if (document.pointerLockElement) document.exitPointerLock()
      return true
    }

    // 结构方块 / 拼图方块: 右键打开设置
    if (blockType === BlockType.STRUCTURE_BLOCK || blockType === BlockType.JIGSAW_BLOCK) {
      if (!pStore.canUseCommandBlocks) return false
      this.eventBus.emit('structureBlock:open', {
        x: position.x, y: position.y, z: position.z,
        blockType: blockType
      })
      if (document.pointerLockElement) document.exitPointerLock()
      return true
    }

    return false
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

  /** 门方块判定 */
  private isDoorBlock(blockType: BlockType): boolean {
    return blockType >= BlockType.OAK_DOOR && blockType <= BlockType.IRON_DOOR
  }

  /** 活板门方块判定 */
  private isTrapdoorBlock(blockType: BlockType): boolean {
    return blockType >= BlockType.OAK_TRAPDOOR && blockType <= BlockType.IRON_TRAPDOOR
  }

  /** 尝试在床上睡觉: 仅夜晚可睡, 睡着后跳到第二天早上 */
  private trySleepInBed(bedPos: THREE.Vector3): void {
    const pStore = usePlayerStore()
    const isNight = this.timeOfDay < 0.22 || this.timeOfDay > 0.78
    if (!isNight) {
      pStore.breakToolName = '🌙 只能在夜晚睡觉'
      setTimeout(() => { pStore.breakToolName = null }, 2000)
      return
    }
    if (this.sleeping) return
    this.sleeping = true
    this.sleepPhase = 0
    this.sleepBedPos.copy(bedPos)
    if (document.pointerLockElement) document.exitPointerLock()
    pStore.breakToolName = '🌙 睡觉中...'
  }

  /** 睡觉: 渐黑 → 跳到早上 → 渐亮 */
  private updateSleep(dt: number): void {
    if (!this.sleeping) return
    const ui = useUIStore()
    if (this.sleepPhase === 0) {
      ui.sleepFade = Math.min(1, ui.sleepFade + dt * 1.6)
      if (ui.sleepFade >= 1) {
        this.sleepPhase = 1
        // 跳到第二天早上
        this.timeOfDay = 0.26
        // 起床站在床边
        this.playerPosition.set(this.sleepBedPos.x + 0.5, this.sleepBedPos.y + 1, this.sleepBedPos.z + 0.5)
        this.playerVelocity.set(0, 0, 0)
        this.fallStartY = this.playerPosition.y
        this.wasInAir = false
      }
    } else {
      ui.sleepFade = Math.max(0, ui.sleepFade - dt * 1.2)
      if (ui.sleepFade <= 0) {
        ui.sleepFade = 0
        this.sleeping = false
        this.sleepPhase = 0
        const pStore = usePlayerStore()
        pStore.breakToolName = '☀️ 新的一天开始了'
        setTimeout(() => { pStore.breakToolName = null }, 2000)
      }
    }
  }

  /** 点燃 TNT: 引信 4 秒后爆炸 */
  private igniteTnt(x: number, y: number, z: number): void {
    this.tntFuses.set(`${x},${y},${z}`, { x, y, z, fuse: 4 })
    const pStore = usePlayerStore()
    pStore.breakToolName = '💥 TNT 已点燃!'
    setTimeout(() => { pStore.breakToolName = null }, 1500)
  }

  /** 更新所有 TNT 引信 */
  private updateTntFuses(dt: number): void {
    if (this.tntFuses.size === 0) return
    for (const [key, tnt] of [...this.tntFuses]) {
      tnt.fuse -= dt
      if (tnt.fuse <= 0) {
        this.tntFuses.delete(key)
        // 引信烧完, TNT 本体被炸毁
        this.chunkManager.setBlock(tnt.x, tnt.y, tnt.z, BlockType.AIR)
        this.explodeTnt(tnt.x, tnt.y, tnt.z)
      }
    }
  }

  /** TNT 爆炸: 摧毁周围方块并伤害玩家 */
  private explodeTnt(cx: number, cy: number, cz: number): void {
    const R = 4
    for (let dx = -R; dx <= R; dx++) {
      for (let dy = -R; dy <= R; dy++) {
        for (let dz = -R; dz <= R; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > R) continue
          const x = cx + dx
          const y = cy + dy
          const z = cz + dz
          const bt = this.chunkManager.getBlock(x, y, z) as BlockType
          if (bt === BlockType.AIR || bt === BlockType.WATER) continue
          if (bt === BlockType.BEDROCK || bt === BlockType.OBSIDIAN || bt === BlockType.CRYING_OBSIDIAN) continue
          const def = BLOCK_REGISTRY[bt]
          if (!def || !def.breakable) continue
          if (bt === BlockType.TNT) {
            // 连锁点燃相邻 TNT
            const key = `${x},${y},${z}`
            if (!this.tntFuses.has(key)) this.tntFuses.set(key, { x, y, z, fuse: 0.4 })
            continue
          }
          // 清理被炸毁容器的数据
          if (bt === BlockType.CHEST || bt === BlockType.BARREL || bt === BlockType.HOPPER) {
            useContainerStore().removeContainer(x, y, z)
          }
          if (bt === BlockType.FURNACE || bt === BlockType.BLAST_FURNACE || bt === BlockType.SMOKER) {
            useFurnaceStore().removeFurnace(x, y, z)
          }
          this.chunkManager.setBlock(x, y, z, BlockType.AIR)
        }
      }
    }
    // 伤害玩家（与爆炸中心距离相关）
    const px = this.playerPosition.x
    const py = this.playerPosition.y + 0.9
    const pz = this.playerPosition.z
    const pd = Math.sqrt((px - (cx + 0.5)) ** 2 + (py - (cy + 0.5)) ** 2 + (pz - (cz + 0.5)) ** 2)
    const damageRange = R * 1.6
    if (pd < damageRange) {
      const damage = Math.round((1 - pd / damageRange) * 38)
      if (damage > 0) this.applyDamage(damage, 'TNT爆炸')
    }
    this.gameAudio.playExplosion()
  }

  /** 压力板: 玩家站上去输出红石信号, 离开后释放 */
  private updatePressurePlates(): void {
    const feetX = Math.floor(this.playerPosition.x)
    const feetY = Math.floor(this.playerPosition.y + 0.05)
    const feetZ = Math.floor(this.playerPosition.z)
    // 压力板是完整方块碰撞, 玩家站在其顶面, 检测脚下与其所在格
    const candidates = [feetY, feetY - 1]
    let platePos: { x: number; y: number; z: number } | null = null
    for (const y of candidates) {
      const bt = this.chunkManager.getBlock(feetX, y, feetZ) as BlockType
      if (bt >= BlockType.OAK_PRESSURE_PLATE && bt <= BlockType.HEAVY_WEIGHTED_PRESSURE_PLATE) {
        platePos = { x: feetX, y, z: feetZ }
        break
      }
    }

    if (platePos) {
      if (!getBlockStateValue(platePos.x, platePos.y, platePos.z, 'powered', false)) {
        setBlockState(platePos.x, platePos.y, platePos.z, { powered: true })
        this.chunkManager.markBlockDirty(platePos.x, platePos.y, platePos.z)
      }
      this.lastPlatePos = platePos
      return
    }
    // 离开压力板后释放信号
    if (this.lastPlatePos) {
      const { x, y, z } = this.lastPlatePos
      if (getBlockStateValue(x, y, z, 'powered', false)) {
        setBlockState(x, y, z, { powered: false })
        this.chunkManager.markBlockDirty(x, y, z)
      }
      this.lastPlatePos = null
    }
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
    this.gameAudio.playHurt()
    exhaustDamage(actualDamage)
  }

  private update(dt: number): void {
    this.updateDayNight(dt)

    // 功能方块状态更新
    this.updateSleep(dt)
    this.updateTntFuses(dt)
    this.updatePressurePlates()
    useFurnaceStore().update(dt)

    // 处理来自背包界面的丢弃请求
    const invDrop = useInventoryStore()
    if (invDrop.pendingDrop) {
      this.spawnDroppedItem(invDrop.pendingDrop.item, invDrop.pendingDrop.count, invDrop.pendingDrop.blockType as any)
      invDrop.pendingDrop = null
    }

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

    // 睡觉时忽略移动输入
    const movement = this.sleeping
      ? { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, sneak: false }
      : this.inputManager.getMovement()
    this.isUnderwater = this.checkUnderwater()
    const isSwimming = this.checkSwimming()

    // === Flying movement (creative mode) ===
    if (this.isFlying) {
      const flySpeed = movement.sprint ? this.flySpeed * 2 : this.flySpeed
      Engine._movFwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      Engine._movRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      Engine._movDir.set(0, 0, 0)
      if (movement.forward) Engine._movDir.add(Engine._movFwd)
      if (movement.backward) Engine._movDir.sub(Engine._movFwd)
      if (movement.left) Engine._movDir.sub(Engine._movRight)
      if (movement.right) Engine._movDir.add(Engine._movRight)

      // Vertical: space = up, sneak = down
      if (movement.jump) Engine._movDir.y += 1
      if (movement.sneak) Engine._movDir.y -= 1

      if (Engine._movDir.lengthSq() > 0) Engine._movDir.normalize().multiplyScalar(flySpeed)

      this.playerVelocity.set(Engine._movDir.x, Engine._movDir.y, Engine._movDir.z)
      this.playerPosition.add(Engine._movDir.multiplyScalar(dt))

      // Reset fall tracking while flying
      this.fallStartY = this.playerPosition.y
      this.wasInAir = false
    }
    // === Underwater swimming ===
    else if (isSwimming) {
      const swimSpeed = PLAYER_SPEED * 0.5
      Engine._movFwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      Engine._movRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      Engine._movDir.set(0, 0, 0)
      if (movement.forward) Engine._movDir.add(Engine._movFwd)
      if (movement.backward) Engine._movDir.sub(Engine._movFwd)
      if (movement.left) Engine._movDir.sub(Engine._movRight)
      if (movement.right) Engine._movDir.add(Engine._movRight)
      if (Engine._movDir.lengthSq() > 0) Engine._movDir.normalize().multiplyScalar(swimSpeed)

      this.playerVelocity.x = Engine._movDir.x
      this.playerVelocity.z = Engine._movDir.z

      // Swim up/down
      if (movement.jump) {
        this.playerVelocity.y = 4.5
      } else if (movement.sneak) {
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

      if (movement.jump && Engine._movDir.lengthSq() > 0) {
        const stepped = this.physicsEngine.trySwimStepUp(swimStart, Engine._movDir, dt)
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
      const speedMult = potionEffects.getSpeedMultiplier()
      const speed = (movement.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED) * speedMult
      Engine._movFwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      Engine._movRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      Engine._movDir.set(0, 0, 0)
      if (movement.forward) Engine._movDir.add(Engine._movFwd)
      if (movement.backward) Engine._movDir.sub(Engine._movFwd)
      if (movement.left) Engine._movDir.sub(Engine._movRight)
      if (movement.right) Engine._movDir.add(Engine._movRight)
      if (Engine._movDir.lengthSq() > 0) Engine._movDir.normalize().multiplyScalar(speed)

      this.playerVelocity.x = Engine._movDir.x
      this.playerVelocity.z = Engine._movDir.z

      // Jump
      if (movement.jump && this.playerOnGround) {
        this.playerVelocity.y = JUMP_VELOCITY * potionEffects.getJumpMultiplier()
        this.playerOnGround = false
        exhaustJump()
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

      // === 虚空保护：掉入未加载区块时回弹到安全位置 ===
      if (this.playerPosition.y < -5) {
        const px = Math.floor(this.playerPosition.x)
        const pz = Math.floor(this.playerPosition.z)
        // 尝试在玩家附近找一块已加载的陆地
        const safeY = this.findSafeY(px, pz)
        if (safeY > 0) {
          this.playerPosition.y = safeY + 2
          this.playerVelocity.set(0, 0, 0)
          this.fallStartY = this.playerPosition.y
          this.wasInAir = false
        } else {
          // 完全找不到安全位置：传送回世界原点附近
          this.playerPosition.set(8.5, 80, 8.5)
          this.playerVelocity.set(0, 0, 0)
          this.fallStartY = 80
          this.wasInAir = false
        }
      }

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

    // === 步声音效 ===
    const isMoving = movement.forward || movement.backward || movement.left || movement.right
    if (this.playerOnGround && isMoving && !this.isFlying) {
      const speed = movement.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED
      this.footstepAccum += speed * dt
      if (this.footstepAccum > 1.8) { // 每 ~1.8m 一步
        this.footstepAccum = 0
        const px = Math.floor(this.playerPosition.x)
        const pz = Math.floor(this.playerPosition.z)
        const below = this.chunkManager.getBlock(px, Math.floor(this.playerPosition.y - 0.1), pz)
        let surface: 'grass' | 'stone' | 'wood' | 'sand' | 'water' = 'stone'
        if (below === BlockType.GRASS_BLOCK || below === BlockType.DIRT) surface = 'grass'
        else if (below === BlockType.SAND || below === BlockType.GRAVEL || below === BlockType.SOUL_SAND) surface = 'sand'
        else if (below >= 7 && below <= 10 || below >= 93 && below <= 107) surface = 'wood'
        else if (below === BlockType.WATER) surface = 'water'
        this.gameAudio.playFootstep(surface)
      }
    } else {
      this.footstepAccum = 0
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

    // === Steel armor set bonus: +10 max health ===
    const invCheck = useInventoryStore()
    const hasSteelSet = invCheck.hasFullSteelArmor
    const pStoreHealth = usePlayerStore()
    if (hasSteelSet !== this.hadFullSteelArmor) {
      this.hadFullSteelArmor = hasSteelSet
      if (hasSteelSet) {
        pStoreHealth.maxHealth = 20
        pStoreHealth.health = Math.min(pStoreHealth.maxHealth, pStoreHealth.health + 10)
      } else {
        pStoreHealth.maxHealth = 10
        pStoreHealth.health = Math.min(pStoreHealth.health, 10)
      }
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

    // Cloud & weather
    const sunDir = new THREE.Vector3(
      Math.cos(this.timeOfDay * Math.PI * 2 - Math.PI / 2),
      Math.sin(this.timeOfDay * Math.PI * 2 - Math.PI / 2),
      0.28,
    ).normalize()
    this.weatherSystem.update(this.playerPosition, dt, this.daylight)
    this.cloudSystem.weatherIntensity = this.weatherSystem.intensity
    this.cloudSystem.update(this.playerPosition, dt, this.daylight, sunDir)

    // Weather audio
    const wCurr = this.weatherSystem.current
    const wInt = this.weatherSystem.intensity
    // 天气音效
    const rainTypes = new Set(['rain', 'thunder', 'drizzle'])
    const windTypes = new Set(['thunder', 'rain', 'snow', 'blizzard', 'sandstorm', 'drizzle', 'foggy'])
    const isRain = rainTypes.has(wCurr)
    const isWind = windTypes.has(wCurr)

    // 雨声：大雨/雷暴=70%, 毛毛雨=25%
    const rainVol = wCurr === 'drizzle' ? wInt * 0.25 : (wCurr === 'thunder' || wCurr === 'rain' ? wInt * 0.7 : 0)
    this.weatherAudio.setRain(rainVol)

    // 风声：雷暴=80%, 暴风雪=75%, 沙尘暴=70%, 雨=30%, 雪=25%, 毛毛雨=15%, 浓雾=10%
    const windVol = wCurr === 'thunder' ? wInt * 0.8
      : wCurr === 'blizzard' ? wInt * 0.75
      : wCurr === 'sandstorm' ? wInt * 0.7
      : wCurr === 'rain' ? wInt * 0.3
      : wCurr === 'snow' ? wInt * 0.25
      : wCurr === 'drizzle' ? wInt * 0.15
      : wCurr === 'foggy' ? wInt * 0.1
      : 0
    this.weatherAudio.setWind(windVol)
    this.weatherAudio.update(dt)

    // 药水效果更新
    potionEffects.update(dt)

    // 饥饿系统更新 (生存模式)
    if (this.gameMode === 'survival' && !this.isDead) {
      const isMoving = movement.forward || movement.backward || movement.left || movement.right
      const pStore = usePlayerStore()
      const result = updateHunger(dt, isMoving, movement.sprint, pStore.health, pStore.maxHealth)
      if (result.tookDamage) {
        this.applyDamage(1, 'starve')
      }
      if (result.newHealth !== pStore.health) {
        pStore.health = result.newHealth
      }
    }

    // Sync player model for third-person view
    this.playerEntity.position.copy(this.playerPosition)
    this.playerEntity.updateMesh()
    this.playerEntity.velocity.copy(this.playerVelocity)
    this.playerEntity.mesh.rotation.y = this.yaw
    this.playerEntity.mesh.visible = this.cameraManager.mode === 'thirdPerson'
    // Update walk animation (entity.update() runs AI, so call animations directly)
    this.playerEntity.updateAnimationsPublic(dt)
    // Sync UI store camera mode
    useUIStore().cameraMode = this.cameraManager.mode

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

    // 检测手持屏障方块变化 - 只有手持屏障时才看见屏障
    const inv = useInventoryStore()
    const heldItem = inv.hotbar[inv.selectedSlot]?.item
    const isHoldingBarrier = heldItem === 'barrier'
    if (isHoldingBarrier !== this.wasHoldingBarrier) {
      this.wasHoldingBarrier = isHoldingBarrier
      this.chunkManager.showBarriers = isHoldingBarrier
      this.chunkManager.markAllDirty()
    }

    // Chunks — 传送期间跳过；未跨区块时仅重建脏网格
    if (!this.isTeleporting) {
      const chunkX = Math.floor(this.playerPosition.x / 16)
      const chunkZ = Math.floor(this.playerPosition.z / 16)
      if (chunkX !== this.lastChunkX || chunkZ !== this.lastChunkZ) {
        this.lastChunkX = chunkX
        this.lastChunkZ = chunkZ
        this.chunkManager.updateChunks(chunkX, chunkZ)
      } else {
        this.chunkManager.rebuildDirtyOnly()
      }
    }
    this.chunkManager.updateFluids(dt)
    this.redstoneSystem.update(dt)
    this.frameCount++

    // === 传送门检测 ===
    if (!this.isTeleporting) {
      const portalResult = this.portalSystem.update(this.playerPosition, dt)
      if (portalResult?.shouldTeleport) {
        this.isTeleporting = true
        this.gameAudio.playTeleport()
        this.teleportToDimension(portalResult.targetDimension).finally(() => {
          this.isTeleporting = false
        })
      }
    }

    // 更新传送门进度到 HUD
    const portalProgress = this.portalSystem.getPortalProgress()
    if (portalProgress > 0) {
      const pStore = usePlayerStore()
      pStore.breakToolName = `传送中... ${Math.floor(portalProgress * 100)}%`
    }

    // 动态光源：每 4 帧更新一次，避免每帧都排序所有光源
    this.lightUpdateAccum += dt
    if (this.lightUpdateAccum >= 0.066) { // ~15fps 更新频率
      this.lightUpdateAccum = 0
      this.chunkManager.updateDynamicLights(this.playerPosition)
    }
    this.updateCreatures(dt)

    // 节流：位置事件每 0.1 秒发送一次（减少 Vue 响应式开销）
    this.posAccum += dt
    if (this.posAccum >= 0.1) {
      this.posAccum = 0
      this.eventBus.emit('player:position', {
        x: Math.floor(this.playerPosition.x),
        y: Math.floor(this.playerPosition.y),
        z: Math.floor(this.playerPosition.z),
      })
      this.eventBus.emit('player:underwater', this.isUnderwater)
    }

    // 节流：生物群系每 0.5 秒更新一次（仅用于 HUD 显示）
    this.biomeAccum += dt
    if (this.biomeAccum >= 0.5) {
      this.biomeAccum = 0
      const biomeId = this.worldGenerator.getBiome(this.playerPosition.x, this.playerPosition.z)
      usePlayerStore().biome = BIOMES[biomeId]?.name ?? biomeId
    }
  }

  private render(_dt: number): void {
    this.chunkManager.updateAnimation(performance.now() * 0.001)

    // === 区块边界渲染 (F3+G) ===
    const ui = useUIStore()
    if (ui.showChunkBorders) {
      this.updateChunkBorderGrid()
    } else if (this.chunkBorderGrid) {
      this.scene.remove(this.chunkBorderGrid)
      this.chunkBorderGrid.geometry.dispose()
      this.chunkBorderGrid = null
    }

    // === 实体碰撞箱渲染 (F3+B) ===
    if (ui.showHitboxes) {
      this.updateEntityHitboxes()
    } else {
      for (const [, mesh] of this.entityHitboxes) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
      }
      this.entityHitboxes.clear()
    }

    this.renderer.render(this.scene, this.cameraManager.activeCamera)
  }

  /** 绘制玩家周围区块边界网格 */
  private updateChunkBorderGrid(): void {
    const range = RENDER_DISTANCE + 1
    const cx = Math.floor(this.playerPosition.x / 16) * 16
    const cz = Math.floor(this.playerPosition.z / 16) * 16
    const minX = cx - range * 16
    const maxX = cx + range * 16
    const minZ = cz - range * 16
    const maxZ = cz + range * 16
    const Y = Math.floor(this.playerPosition.y) - 1

    const vertices: number[] = []
    for (let x = minX; x <= maxX; x += 16) {
      vertices.push(x, Y, minZ, x, Y, maxZ)
    }
    for (let z = minZ; z <= maxZ; z += 16) {
      vertices.push(minX, Y, z, maxX, Y, z)
    }
    // 垂直线（区块四角）
    for (let x = minX; x <= maxX; x += 16) {
      for (let z = minZ; z <= maxZ; z += 16) {
        vertices.push(x, Y, z, x, Y + 16, z)
      }
    }

    if (this.chunkBorderGrid) {
      this.scene.remove(this.chunkBorderGrid)
      this.chunkBorderGrid.geometry.dispose()
      this.chunkBorderGrid = null
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    const mat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6, depthTest: true })
    this.chunkBorderGrid = new THREE.LineSegments(geo, mat)
    this.chunkBorderGrid.renderOrder = 999
    this.scene.add(this.chunkBorderGrid)
  }

  /** 绘制实体碰撞箱 */
  private updateEntityHitboxes(): void {
    const entities = this.entityManager.getAllEntities()
    const seenIds = new Set<string>()

    for (const entity of entities) {
      if (!entity.isAlive) continue
      seenIds.add(entity.id)

      if (this.entityHitboxes.has(entity.id)) continue

      // 创建白色线框碰撞箱
      const w = entity.mesh?.userData?.width ?? 0.6
      const h = entity.mesh?.userData?.height ?? 1.8
      const boxGeo = new THREE.BoxGeometry(w, h, w)
      const edgesGeo = new THREE.EdgesGeometry(boxGeo)
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthTest: true })
      const hitbox = new THREE.LineSegments(edgesGeo, mat)
      hitbox.renderOrder = 998
      hitbox.position.copy(entity.position)
      hitbox.position.y += h / 2
      this.scene.add(hitbox)
      this.entityHitboxes.set(entity.id, hitbox)
      boxGeo.dispose() // EdgesGeometry copies the data
    }

    // 更新位置 & 清理已消失的实体
    for (const [id, hitbox] of this.entityHitboxes) {
      if (!seenIds.has(id)) {
        this.scene.remove(hitbox)
        hitbox.geometry.dispose()
        this.entityHitboxes.delete(id)
      } else {
        const entity = entities.find(e => e.id === id)
        if (entity) {
          hitbox.position.copy(entity.position)
          const h = entity.mesh?.userData?.height ?? 1.8
          hitbox.position.y += h / 2
        }
      }
    }
  }

  private updateDayNight(dt: number): void {
    this.timeOfDay = (this.timeOfDay + dt / this.dayLengthSeconds) % 1
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2
    // 复用缓存的 sunDirection 向量，避免每帧分配
    Engine._sunDir.set(Math.cos(angle), Math.sin(angle), 0.28).normalize()
    this.daylight = THREE.MathUtils.smoothstep(Engine._sunDir.y, -0.18, 0.12)

    const w = this.weatherSystem.intensity
    const wType = this.weatherSystem.current
    const isRain = wType === 'rain'
    const isDrizzle = wType === 'drizzle'
    const isSnow = wType === 'snow' || wType === 'blizzard'
    const isThunder = wType === 'thunder'
    const isSandstorm = wType === 'sandstorm'
    const isFoggy = wType === 'foggy'
    const isBlizzard = wType === 'blizzard'

    // Weather-blended sky colour
    let weatherSky: THREE.Color
    if (isThunder) weatherSky = Engine._thunderSky
    else if (isRain || isDrizzle) weatherSky = Engine._rainSky
    else if (isSnow) weatherSky = Engine._snowSky
    else if (isSandstorm) weatherSky = Engine._sandSky
    else if (isFoggy) weatherSky = Engine._fogSky
    else weatherSky = Engine._daySky

    // 复用缓存的 Color 对象进行 lerp，避免 clone() 分配
    const baseSkyColor = Engine._tmpColor1.copy(Engine._nightSky).lerp(Engine._daySky, this.daylight)
    const weatherSkyColor = Engine._tmpColor2.copy(Engine._nightSky).lerp(weatherSky, this.daylight)
    const skyColor = Engine._tmpColor3.copy(baseSkyColor).lerp(weatherSkyColor, w)

    // Ambient: weather reduces daylight reach
    const weatherAmbientScale = 1.0 - w * (
      isThunder ? 0.7 : isBlizzard ? 0.5 : isRain ? 0.4 :
      isDrizzle ? 0.2 : isSnow ? 0.15 : isSandstorm ? 0.35 : isFoggy ? 0.1 : 0)
    let ambient = 0.08 + this.daylight * 0.47
    ambient *= weatherAmbientScale
    if (isSnow) ambient += w * 0.12

    // Thunder flash
    const flash = this.weatherSystem.getThunderFlash()
    const flashBoost = flash > 0.01 ? flash * 0.6 : 0

    const weatherTypeCode = isThunder || isSandstorm ? 3 : (isRain || isDrizzle) ? 1 : isSnow ? 2 : isFoggy ? 1 : 0
    this.sky.updateCycle(this.daylight + flashBoost, Engine._sunDir, w, weatherTypeCode)
    this.ambientLight.intensity = ambient + flashBoost
    this.ambientLight.color.set(isSnow ? 0xe8eeff : 0xffffff)
    this.sunLight.intensity = (0.04 + this.daylight * 0.92) * weatherAmbientScale
    this.sunLight.color.set(this.daylight < 0.45 ? 0xffb36b : 0xffffff)
    this.sunLight.position.copy(this.playerPosition).addScaledVector(Engine._sunDir, 120)
    this.sunLight.target.position.copy(this.playerPosition)
    this.chunkMesher.updateEnvironment(Engine._sunDir, ambient, skyColor)
    this.chunkMesher.updateCamera(this.cameraManager.activeCamera.position)

    // Fog: weather reduces visibility
    const fogBaseNear = 32 + this.daylight * 48
    const fogBaseFar  = 80 + this.daylight * 96
    const fogReduce = 1.0 - w * (
      isThunder ? 0.65 : isBlizzard ? 0.6 : isRain ? 0.45 :
      isDrizzle ? 0.25 : isSnow ? 0.35 : isSandstorm ? 0.55 : isFoggy ? 0.7 : 0)
    const fogNear = fogBaseNear * fogReduce
    const fogFar  = Math.max(fogNear + 8, fogBaseFar * fogReduce)
    const fogColor = Engine._tmpColor4.copy(baseSkyColor).lerp(weatherSkyColor, w * 0.8)

    this.chunkMesher.opaqueMaterial.uniforms.fogNear.value = fogNear
    this.chunkMesher.opaqueMaterial.uniforms.fogFar.value = fogFar
    this.chunkMesher.opaqueMaterial.uniforms.fogColor.value.copy(fogColor)
    this.chunkMesher.transparentMaterial.uniforms.fogNear.value = fogNear
    this.chunkMesher.transparentMaterial.uniforms.fogFar.value = fogFar
    this.chunkMesher.transparentMaterial.uniforms.fogColor.value.copy(fogColor)

    if (!this.isUnderwater) this.renderer.setClearColor(fogColor)
    usePlayerStore().timeOfDay = this.timeOfDay
  }

  private updateCreatures(dt: number): void {
    this.entityManager.update(dt)

    // === 掉落物更新与拾取 ===
    const toRemove: string[] = []
    for (const item of this.droppedItems) {
      // 地面碰撞
      if (item.position.y <= 0) {
        item.position.y = 0.1
        item.velocity.y = 0
        item.onGround = true
      } else {
        // 检测方块碰撞
        const blockBelow = this.chunkManager.getBlock(
          Math.floor(item.position.x),
          Math.floor(item.position.y - 0.1),
          Math.floor(item.position.z)
        )
        if (blockBelow !== 0 && blockBelow !== undefined && !BLOCK_REGISTRY[blockBelow]?.transparent) {
          item.position.y = Math.floor(item.position.y) + 0.15
          item.velocity.y = 0
          item.onGround = true
        }
      }

      // 拾取检测（玩家 1.5 格范围内）
      if (item.canPickup()) {
        const dist = item.position.distanceTo(this.playerPosition)
        if (dist < 1.5) {
          const inv = useInventoryStore()
          const leftover = inv.addItem(item.itemId, item.count, item.blockType as any)
          if (leftover === 0) {
            toRemove.push(item.id)
          } else {
            item.count = leftover
          }
        }
      }

      // 超时消失
      if (item.shouldDespawn()) {
        toRemove.push(item.id)
      }
    }

    // 清理已拾取/消失的物品
    for (const id of toRemove) {
      this.entityManager.removeEntity(id)
      this.droppedItems = this.droppedItems.filter(i => i.id !== id)
    }

    // Auto weather cycling
    this.weatherTimer -= dt
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 60 + Math.random() * 240 // 1-5 min 随机间隔
      const types: WeatherType[] = ['clear', 'rain', 'drizzle', 'snow', 'blizzard', 'thunder', 'sandstorm', 'foggy', 'clear', 'clear']
      const next = types[Math.floor(Math.random() * types.length)]
      if (next !== this.weatherSystem.target) {
        this.weatherSystem.request(next)
        usePlayerStore().weather = next
      }
    }

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

    if (animalCount < 12) this.spawnAnimal()
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

  /** Biome → possible animals for spawning. */
  private static readonly BIOME_ANIMALS: Record<string, AnimalKind[]> = {
    plains: ['cow','pig','sheep','chicken','horse'],
    sunflower_plains: ['cow','pig','sheep','chicken','horse','rabbit'],
    forest: ['cow','pig','sheep','chicken','wolf','rabbit'],
    flower_forest: ['sheep','chicken','rabbit','bee'],
    birch_forest: ['cow','sheep','chicken','rabbit'],
    dark_forest: ['pig','chicken','wolf'],
    taiga: ['wolf','fox','sheep','rabbit'],
    snowy_taiga: ['wolf','fox'],
    old_growth_taiga: ['wolf','fox','sheep'],
    snowy_plains: ['polar_bear','rabbit'],
    ice_spikes: ['polar_bear'],
    desert: ['rabbit','horse'],
    savanna: ['cow','pig','sheep','chicken','horse','donkey'],
    savanna_plateau: ['horse','donkey','cow'],
    badlands: [],
    wooded_badlands: ['cow','sheep'],
    jungle: ['chicken','pig','parrot','ocelot'],
    sparse_jungle: ['chicken','pig','parrot'],
    bamboo_jungle: ['panda','chicken','pig'],
    swamp: ['frog','pig','chicken'],
    mangrove_swamp: ['frog'],
    windswept_hills: ['sheep','goat','pig'],
    windswept_forest: ['sheep','goat','wolf'],
    windswept_gravelly_hills: ['goat'],
    meadow: ['sheep','cow','rabbit'],
    grove: ['sheep','wolf','rabbit'],
    jagged_peaks: ['goat'],
    frozen_peaks: ['goat','polar_bear'],
    stony_peaks: ['goat'],
    beach: ['turtle'],
    snowy_beach: ['rabbit'],
    stony_shore: [],
    river: ['frog','chicken'],
    frozen_river: ['rabbit'],
    ocean: ['squid'],
    deep_ocean: ['squid'],
    warm_ocean: ['turtle','squid'],
    lukewarm_ocean: ['squid'],
    cold_ocean: ['squid'],
    frozen_ocean: ['polar_bear'],
    mushroom_fields: ['cow','sheep'],
  }

  private spawnAnimal(): void {
    const position = this.findCreatureSpawn()
    if (!position) return

    const biome = this.worldGenerator.getBiome(position.x, position.z)
    const kinds = Engine.BIOME_ANIMALS[biome] ?? ['cow','pig','sheep']
    if (kinds.length === 0) {
      // Try plains animals as fallback
      const fallback: AnimalKind[] = ['cow','pig','sheep','chicken']
      const kind = fallback[Math.floor(Math.random() * fallback.length)]
      const animal = new Animal(`animal-${this.nextEntityId++}`, kind)
      animal.position.copy(position)
      animal.setHome(position)
      animal.setChunkManager(this.chunkManager)
      this.entityManager.addEntity(animal)
      return
    }
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
    // 使用容器实际尺寸，正确处理刘海屏 safe-area 裁剪
    const rect = this.container.getBoundingClientRect()
    const width = rect.width || window.innerWidth
    const height = rect.height || window.innerHeight
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

  /** 保存游戏状态 */
  saveGame(): boolean {
    const pStore = usePlayerStore()
    const inv = useInventoryStore()

    const saveData = {
      version: 1 as const,
      timestamp: Date.now(),
      playerPosition: { x: this.playerPosition.x, y: this.playerPosition.y, z: this.playerPosition.z },
      playerVelocity: { x: this.playerVelocity.x, y: this.playerVelocity.y, z: this.playerVelocity.z },
      health: pStore.health,
      oxygen: pStore.oxygen,
      gameMode: pStore.gameMode,
      isFlying: pStore.isFlying,
      timeOfDay: pStore.timeOfDay,
      worldSeed: this.seed,
      isSuperflat: this.superflat,
      yaw: this.yaw,
      pitch: this.pitch,
      hotbar: inv.hotbar.map(slot => ({
        item: slot.item,
        count: slot.count,
        blockType: slot.blockType,
        durabilityDamage: slot.durabilityDamage,
      })),
      mainInventory: inv.mainInventory.map(slot => ({
        item: slot.item,
        count: slot.count,
        blockType: slot.blockType,
      })),
      armor: inv.armor.map(slot => ({
        item: slot.item,
        slotType: slot.slotType,
      })),
    }

    return SaveSystem.save(saveData)
  }

  /** 加载游戏状态 */
  loadGame(saveData: import('@/gameplay/SaveSystem').SaveData): boolean {
    try {
      const pStore = usePlayerStore()
      const inv = useInventoryStore()

      // 恢复玩家状态
      this.playerPosition.set(saveData.playerPosition.x, saveData.playerPosition.y, saveData.playerPosition.z)
      this.playerVelocity.set(saveData.playerVelocity.x, saveData.playerVelocity.y, saveData.playerVelocity.z)
      this.yaw = saveData.yaw
      this.pitch = saveData.pitch

      // 恢复 UI store
      pStore.health = saveData.health
      pStore.oxygen = saveData.oxygen
      pStore.gameMode = saveData.gameMode
      pStore.isFlying = saveData.isFlying
      pStore.timeOfDay = saveData.timeOfDay

      // 恢复物品栏
      for (let i = 0; i < 9; i++) {
        const slot = saveData.hotbar[i]
        inv.hotbar[i] = {
          item: slot.item,
          count: slot.count,
          blockType: slot.blockType as any,
          durabilityDamage: slot.durabilityDamage,
        }
      }
      for (let i = 0; i < 27; i++) {
        const slot = saveData.mainInventory[i]
        inv.mainInventory[i] = {
          item: slot.item,
          count: slot.count,
          blockType: slot.blockType as any,
        }
      }
      for (let i = 0; i < 4; i++) {
        const slot = saveData.armor[i]
        inv.armor[i] = {
          item: slot.item,
          slotType: slot.slotType as any,
        }
      }

      // 更新相机
      this.cameraManager.setRotation(this.yaw, this.pitch)

      return true
    } catch (err) {
      console.error('[Engine] Failed to load game:', err)
      return false
    }
  }

  // ==================== 丢弃物品系统 ====================

  /** 在玩家面前生成一个掉落物 */
  spawnDroppedItem(itemId: string, count: number, blockType?: number): void {
    const dropPos = this.playerPosition.clone()
    // 丢弃在玩家前方 1.5 格
    dropPos.x -= Math.sin(this.yaw) * 1.5
    dropPos.z -= Math.cos(this.yaw) * 1.5
    dropPos.y += 0.5

    const id = `dropped_${this.droppedItemIdCounter++}`
    const item = new DroppedItem(id, itemId, count, dropPos, blockType)
    this.droppedItems.push(item)
    this.entityManager.addEntity(item)
  }

  /** 丢弃快捷栏中选中的1个物品 */
  private dropSelectedItem(): void {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot || !slot.item || slot.count <= 0) return

    const dropped = inv.dropFromSlot(inv.selectedSlot, true)
    if (dropped) {
      this.spawnDroppedItem(dropped.item, dropped.count, dropped.blockType)
    }
  }

  /** 丢弃物品栏中指定槽位的1个物品 */
  dropFromInventorySlot(slotIndex: number, fromHotbar: boolean): void {
    const inv = useInventoryStore()
    const dropped = inv.dropFromSlot(slotIndex, fromHotbar)
    if (dropped) {
      this.spawnDroppedItem(dropped.item, dropped.count, dropped.blockType)
    }
  }

  // ==================== 传送门 & 维度切换 ====================

  /**
   * 传送玩家到指定维度
   * 卸载当前维度区块，加载目标维度区块，生成安全平台，改变天空颜色
   */
  private async teleportToDimension(targetDimension: Dimension): Promise<void> {
    const prevDimension = this.portalSystem.currentDimension

    // 保存当前维度位置
    this.portalSystem.savePosition(prevDimension, this.playerPosition)

    // 计算目标位置
    let targetPos: THREE.Vector3
    const saved = this.portalSystem.getSavedPosition(targetDimension)
    if (saved) {
      targetPos = saved.clone()
    } else {
      // 首次进入某维度：选择有建筑的出生点（走廊中间，避免卡墙）
      if (targetDimension === 'nether') {
        // 出生在下界堡垒走廊交汇处（chunk 307,7 内部 x=9,z=9）
        targetPos = new THREE.Vector3(4921, 80, 121)
      } else if (targetDimension === 'end') {
        targetPos = new THREE.Vector3(-4992, 80, 8)
      } else {
        targetPos = new THREE.Vector3(8, 80, 8)
      }
    }

    // ★ 关键：切换到目标维度（卸载旧区块网格，切换生成器维度，加载新区块）
    await this.chunkManager.switchDimension(targetDimension, targetPos.x, targetPos.z)

    // 同步 portalSystem 的维度状态
    this.portalSystem.currentDimension = targetDimension

    // 在目标位置生成安全平台（如果还没有地面）
    this.generateDimensionPlatform(Math.floor(targetPos.x), Math.floor(targetPos.z), targetDimension)

    // 找到安全 Y 位置
    // 注意：下界有基岩天花板，getHeightAt 会返回天花板高度而非地表
    // 使用 getSurfaceHeightAt 从合适的高度向下搜索地表
    const surfaceY = this.chunkManager.getHeightAt(
      Math.floor(targetPos.x), Math.floor(targetPos.z),
      targetDimension === 'nether' ? 120 : undefined
    )
    if (surfaceY > 0) {
      targetPos.y = surfaceY + 2
    }

    // 传送玩家
    this.playerPosition.copy(targetPos)
    this.playerVelocity.set(0, 0, 0)
    this.fallStartY = targetPos.y
    this.wasInAir = false

    // ★ 防卡墙：如果出生在固体方块中，向上提升直到安全
    this.unstuckPlayer()

    // 改变天空颜色
    this.updateSkyForDimension(targetDimension)

    // 通知玩家
    const pStore = usePlayerStore()
    const dimNames: Record<Dimension, string> = {
      overworld: '🌍 主世界',
      nether: '🔥 下界',
      end: '🌌 末地',
    }
    pStore.breakToolName = dimNames[targetDimension]
    setTimeout(() => { pStore.breakToolName = null }, 3000)
  }

  /**
   * 在指定位置生成维度平台
   */
  private generateDimensionPlatform(cx: number, cz: number, dimension: Dimension): void {
    const blockType = dimension === 'nether' ? BlockType.NETHERRACK
      : dimension === 'end' ? BlockType.END_STONE
      : BlockType.STONE

    // 生成 5x5 平台，3 格高
    const maxSearchY = dimension === 'nether' ? 120 : undefined
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const height = this.chunkManager.getHeightAt(cx + dx, cz + dz, maxSearchY)
        // 如果高度太低（虚空），放置平台方块
        if (height < 5) {
          for (let dy = 0; dy < 3; dy++) {
            this.chunkManager.setBlock(cx + dx, dy, cz + dz, blockType)
          }
        }
      }
    }
  }

  /**
   * 防卡墙：如果玩家出生在固体方块中，向上提升到安全位置
   */
  private unstuckPlayer(): void {
    const px = Math.floor(this.playerPosition.x)
    const py = Math.floor(this.playerPosition.y)
    const pz = Math.floor(this.playerPosition.z)

    // 检测脚部和头部是否在固体方块中
    const isSolid = (bx: number, by: number, bz: number): boolean => {
      const block = this.chunkManager.getBlock(bx, by, bz)
      return block !== BlockType.AIR && block !== BlockType.WATER &&
             block !== BlockType.NETHER_PORTAL && block !== BlockType.END_PORTAL
    }

    let attempts = 0
    if (isSolid(px, py, pz) || isSolid(px, py + 1, pz)) {
      // 先向下找（可能只是头顶卡住）
      let testY = py
      while (testY > 0 && (isSolid(px, testY, pz) || isSolid(px, testY + 1, pz))) {
        testY--
      }
      if (testY > 0) {
        this.playerPosition.y = testY + 0.1
      } else {
        // 向下找不到空位，向上找
        testY = py
        while (testY < 250 && (isSolid(px, testY, pz) || isSolid(px, testY + 1, pz))) {
          testY++
          attempts++
          if (attempts > 60) break // 防止死循环
        }
        this.playerPosition.y = testY + 0.1
      }
    }
    this.fallStartY = this.playerPosition.y
  }

  /**
   * 根据维度改变天空颜色
   */
  private updateSkyForDimension(dimension: Dimension): void {
    switch (dimension) {
      case 'nether':
        this.renderer.setClearColor(0x330808)
        this.scene.fog = new THREE.Fog(0x330808, 10, 60)
        this.sunLight.intensity = 0.1
        this.ambientLight.intensity = 0.3
        break
      case 'end':
        this.renderer.setClearColor(0x000008)
        this.scene.fog = new THREE.Fog(0x000008, 20, 100)
        this.sunLight.intensity = 0.2
        this.ambientLight.intensity = 0.2
        break
      default:
        // 恢复主世界天空（由 updateDayNight 接管）
        this.scene.fog = null
        break
    }
  }

  /**
   * 尝试激活传送门（打火石右键点击或末影之眼右键点击框架）
   */
  private tryActivatePortal(tx: number, ty: number, tz: number): boolean {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]

    // 打火石 → 激活地狱传送门（新算法直接在黑曜石上工作）
    if (slot?.item === 'flint_and_steel') {
      if (this.portalSystem.tryActivateNetherPortal(tx, ty, tz)) {
        this.consumeFlintAndSteel(slot)
        this.gameAudio.playPortalActivate()
        return true
      }
      return false
    }

    // 末影之眼 → 激活末地传送门框架
    if (slot?.item === 'ender_eye') {
      if (this.portalSystem.tryActivateEndPortalFrame(tx, ty, tz)) {
        slot.count--
        if (slot.count <= 0) {
          slot.item = null
          slot.count = 0
        }
        return true
      }
    }

    return false
  }

  /** 消耗打火石耐久 */
  private consumeFlintAndSteel(slot: { item: string | null; count: number; durabilityDamage?: number }): void {
    if (slot.durabilityDamage === undefined) slot.durabilityDamage = 0
    slot.durabilityDamage++
    const itemDef = getItemDefinition(slot.item!)
    if (itemDef?.durability && slot.durabilityDamage >= itemDef.durability) {
      slot.item = null
      slot.count = 0
      slot.durabilityDamage = 0
    }
  }

  /**
   * 通过方块交互目标尝试激活传送门
   */
  private tryActivatePortalOnTarget(): boolean {
    const inv = useInventoryStore()
    const slot = inv.hotbar[inv.selectedSlot]
    if (!slot?.item) return false

    if (slot.item !== 'flint_and_steel' && slot.item !== 'ender_eye') return false

    // 优先使用方块交互目标
    const target = this.blockInteraction.getTargetBlock()
    if (target) {
      if (this.tryActivatePortal(target.position.x, target.position.y, target.position.z)) return true
      // 打火石额外尝试：目标相邻位置（可能刚好指向框架内部空气）
      if (slot.item === 'flint_and_steel') {
        const adjPos = this.blockInteraction.getAdjacentPlacementPos()
        if (adjPos) {
          if (this.tryActivatePortal(adjPos.x, adjPos.y, adjPos.z)) return true
        }
      }
    }

    // 备用：直接射线检测
    const camPos = this.cameraManager.activeCamera.position.clone()
    const camDir = this.cameraManager.getForwardDirection()
    const hit = this.chunkManager.raycast(camPos, camDir, 6)
    if (hit) {
      if (this.tryActivatePortal(hit.position.x, hit.position.y, hit.position.z)) return true
      // 打火石：也尝试射线命中面的相邻位置
      if (slot.item === 'flint_and_steel') {
        const adjX = hit.position.x + hit.normal.x
        const adjY = hit.position.y + hit.normal.y
        const adjZ = hit.position.z + hit.normal.z
        return this.tryActivatePortal(adjX, adjY, adjZ)
      }
    }
    return false
  }

  /** 根据方块类型返回音效分类 */
  private getBlockSoundType(blockType: number): 'stone' | 'wood' | 'dirt' | 'sand' | 'glass' | 'metal' {
    // 石头类
    if (blockType <= 2 || (blockType >= 5 && blockType <= 6) || (blockType >= 85 && blockType <= 92) || blockType === 46 || blockType === 47) return 'stone'
    // 木头类
    if ((blockType >= 7 && blockType <= 10) || (blockType >= 93 && blockType <= 107) || blockType === 159 || blockType === 160 || blockType === 168) return 'wood'
    // 沙子类
    if (blockType === BlockType.SAND || blockType === BlockType.GRAVEL || blockType === BlockType.SOUL_SAND || blockType === 12) return 'sand'
    // 玻璃类
    if (blockType === BlockType.GLASS || blockType === BlockType.GLOWSTONE || blockType === BlockType.ICE || blockType === BlockType.SEA_LANTERN) return 'glass'
    // 金属类
    if (blockType >= 70 && blockType <= 73 || blockType === BlockType.IRON_ORE || blockType === BlockType.GOLD_ORE) return 'metal'
    return 'dirt'
  }

  /**
   * 虚空保护：在指定 x/z 位置查找安全的 Y 坐标
   * 搜索附近已加载的固体方块，返回最高方块顶部 Y 值
   */
  private findSafeY(cx: number, cz: number): number {
    // 先尝试精确位置
    const directHeight = this.chunkManager.getHeightAt(cx, cz)
    if (directHeight > 0) return directHeight

    // 搜索附近 16 格范围
    for (let radius = 1; radius <= 16; radius += 2) {
      for (const [dx, dz] of [[radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
        const h = this.chunkManager.getHeightAt(cx + dx, cz + dz)
        if (h > 0) return h
      }
    }
    return 0
  }

  dispose(): void {
    this.gameLoop.stop()
    this.stopBreaking()
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval)
    this.blockInteraction.dispose()
    this.redstoneSystem.dispose()
    this.entityManager.dispose()
    this.sky.dispose()
    this.cloudSystem.dispose()
    this.weatherSystem.dispose()
    this.weatherAudio.dispose()
    this.gameAudio.dispose()
    this.renderer.dispose()
    this.textureAtlas.dispose()
    this.chunkManager.dispose()
  }
}
