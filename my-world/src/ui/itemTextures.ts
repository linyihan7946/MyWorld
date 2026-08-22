/**
 * Item Textures - procedurally-generated 16x16 pixel-art icons for all non-block items.
 * Each icon is rendered to a canvas and cached as a data URL.
 */

// ── Types ──────────────────────────────────────────────────────────────────

type PixelMap = Record<string, string>
type Template = string[]
type Pixel = [number, number, string]

// ── Canvas helper ──────────────────────────────────────────────────────────

const ICON_SIZE = 16

function templateToPixels(tpl: Template, colorMap: PixelMap): Pixel[] {
  const pixels: Pixel[] = []
  for (let y = 0; y < tpl.length; y++) {
    const row = tpl[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== ' ' && colorMap[ch]) {
        pixels.push([x, y, colorMap[ch]])
      }
    }
  }
  return pixels
}

function drawPixels(ctx: CanvasRenderingContext2D, pixels: ReadonlyArray<ReadonlyArray<number | string>>) {
  for (const pixel of pixels) {
    ctx.fillStyle = String(pixel[2])
    ctx.fillRect(Number(pixel[0]), Number(pixel[1]), 1, 1)
  }
}

function generateDataUrl(tpl: Template, colorMap: PixelMap): string {
  const canvas = document.createElement('canvas')
  canvas.width = ICON_SIZE
  canvas.height = ICON_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
  drawPixels(ctx, templateToPixels(tpl, colorMap))
  return canvas.toDataURL('image/png')
}

// ── Cache ──────────────────────────────────────────────────────────────────

const iconCache = new Map<string, string>()

function getCachedIcon(itemId: string, generator: () => string): string {
  let url = iconCache.get(itemId)
  if (!url) {
    url = generator()
    iconCache.set(itemId, url)
  }
  return url
}

// ── Reusable template shapes ───────────────────────────────────────────────

// Ingot / bar shape (10 wide × 4 tall, centred)
const INGOT_TPL: Template = [
  '     HMMMMMMS    ',
  '    HMMMMMMMS    ',
  '    HMMMMMMMS    ',
  '     HMMMMMMS    ',
]

// Gem / diamond shape (8 wide × 8 tall, centred)
const GEM_TPL: Template = [
  '       HH        ',
  '      HMMH       ',
  '     HMMMMH      ',
  '    HMMMMMMH     ',
  '    HMMMMMS      ',
  '     HMMMMS      ',
  '      HMMS       ',
  '       SS        ',
]

// Circle (10 wide × 10 tall, centred) – used for compass, clock, ender pearl, etc.
const CIRCLE_TPL: Template = [
  '     BBBBBB      ',
  '    BMMMMMMB     ',
  '   BM......MB    ',
  '   BM......MB    ',
  '   BM......MB    ',
  '   BM......MB    ',
  '   BM......MB    ',
  '   BM......MB    ',
  '    BMMMMMMB     ',
  '     BBBBBB      ',
]

// Small powder pile (7 wide × 4 tall)
const POWDER_TPL: Template = [
  '      HH       ',
  '     HMMH      ',
  '    HMMMMH     ',
  '     HHHH      ',
]

// Bowl shape (12 wide × 4 tall)
const BOWL_TPL: Template = [
  '    BBBBBBBB    ',
  '   BMMMMMMMMB   ',
  '   BMMMMMMMMB   ',
  '    BBBBBB      ',
]

// Book shape (9 wide × 11 tall)
const BOOK_TPL: Template = [
  '    BBBBB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BRRRB      ',
  '    BBBBB      ',
]

// Paper (9 wide × 11 tall)
const PAPER_TPL: Template = [
  '    WWWWW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WGGGW      ',
  '    WWWWW      ',
]

// Feather (centred, 7 wide × 14 tall)
const FEATHER_TPL: Template = [
  '        W      ',
  '       WWW     ',
  '      WWWW     ',
  '      WWWWS    ',
  '     WWWWWS    ',
  '     WWWWS     ',
  '     WWWW      ',
  '     WWW       ',
  '     WW        ',
  '     WW        ',
  '      W        ',
  '      W        ',
  '      W        ',
  '      W        ',
]

// Leather hide (10 wide × 8 tall)
const LEATHER_TPL: Template = [
  '   LLLLLL      ',
  '  LMMMMMML     ',
  '  LMMMMMML     ',
  '  LMMMMMML     ',
  '  LMMMMMML     ',
  '  LMMMMMML     ',
  '  LMMMMMML     ',
  '   LLLLLL      ',
]

// Simple small seed / drop (5 wide × 4 tall)
const SEED_TPL: Template = [
  '      H        ',
  '     HMH       ',
  '     HMM       ',
  '      H        ',
]

// Cookie (8 wide × 8 tall)
const COOKIE_TPL: Template = [
  '    MMMM       ',
  '   MHMMMM      ',
  '  MMMDMMMMM    ',
  '  MMDMMMMMS    ',
  '  MMDMMMMMS    ',
  '  MMMMMMMS     ',
  '   MMMMMS      ',
  '    MMMM       ',
]

// Music disc (12 wide × 12 tall)
const DISC_TPL: Template = [
  '    BBBBBB       ',
  '   BHHHHHHB      ',
  '  BHDDDDDDHB     ',
  '  BHDMMMMDHB     ',
  '  BHDMMMMDHB     ',
  '  BHDDDDDDHB     ',
  '  BHDDDDDDHB     ',
  '  BHDMMMMDHB     ',
  '  BHDMMMMDHB     ',
  '  BHDDDDDDHB     ',
  '   BHHHHHHB      ',
  '    BBBBBB       ',
]

// Wheat stalk (centred, 5 wide × 14 tall)
const WHEAT_TPL: Template = [
  '     WW        ',
  '    WMMW       ',
  '     WWMW      ',
  '    WMWW       ',
  '     WWMW      ',
  '    WMW        ',
  '     W         ',
  '     W         ',
  '     W         ',
  '     W         ',
  '     W         ',
  '     W         ',
  '     W         ',
  '     W         ',
]

// ── Tool / weapon handle overlay ───────────────────────────────────────────
// Diagonal handle pixels (handle + shadow) shared by all tools.
// These are drawn AFTER the head so they sit underneath it.

const HANDLE_PIXELS: Array<[number, number, string]> = [
  // handle (H)
  [7, 4, '#8B6B3D'], [8, 4, '#8B6B3D'],
  [8, 5, '#8B6B3D'], [9, 5, '#8B6B3D'],
  [9, 6, '#8B6B3D'], [10, 6, '#8B6B3D'],
  [10, 7, '#8B6B3D'], [11, 7, '#8B6B3D'],
  [11, 8, '#8B6B3D'], [12, 8, '#8B6B3D'],
  [12, 9, '#8B6B3D'], [13, 9, '#8B6B3D'],
  [13, 10, '#8B6B3D'], [14, 10, '#8B6B3D'],
  [14, 11, '#8B6B3D'], [15, 11, '#8B6B3D'],
  [15, 12, '#8B6B3D'],
  // shadow (S)
  [7, 5, '#6B4B2D'],
  [8, 6, '#6B4B2D'], [9, 6, '#6B4B2D'],
  [10, 7, '#6B4B2D'], [11, 7, '#6B4B2D'],
  [12, 8, '#6B4B2D'], [13, 8, '#6B4B2D'],
  [14, 9, '#6B4B2D'], [15, 9, '#6B4B2D'],
  [14, 12, '#6B4B2D'], [15, 12, '#6B4B2D'],
]

// ── Tool head templates (only the head part, no handle) ────────────────────
// Head colours: H=head, S=head-shadow – mapped per tier.

const PICKAXE_HEAD_TPL: Template = [
  '   HHHHHHHHS     ',
  '   HHHHHHHH      ',
  '      HHH        ',
]

const AXE_HEAD_TPL: Template = [
  '   HHHH          ',
  '   HHHHH         ',
  '   HHHHH         ',
  '   HHHH          ',
]

const SHOVEL_HEAD_TPL: Template = [
  '     HHH         ',
  '    HHHHH        ',
  '    HHHHH        ',
  '    HHHHH        ',
  '     HHH         ',
  '      H          ',
]

const HOE_HEAD_TPL: Template = [
  '   HHHHH         ',
  '   HHHHH         ',
  '      H          ',
  '      H          ',
]

// ── Sword blade template (vertical blade + crossguard + handle + pommel) ───

const SWORD_TPL: Template = [
  '         H       ',  // 0  tip
  '        HHH      ',  // 1
  '        HHH      ',  // 2
  '        HHH      ',  // 3
  '        HHH      ',  // 4
  '        HHH      ',  // 5
  '        HHH      ',  // 6
  '        HHH      ',  // 7
  '     HHGHHGH     ',  // 8  crossguard  (G=guard colour)
  '       HH        ',  // 9
  '      HH         ',  // 10
  '     HH          ',  // 11
  '    HH           ',  // 12
  '   PP            ',  // 13  pommel
]

// ── Bow template ───────────────────────────────────────────────────────────

const BOW_TPL: Template = [
  '        HHH      ',
  '       H   H     ',
  '      H     H    ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '     H       H   ',
  '      H     H    ',
  '       H   H     ',
  '        HHH      ',
]

// ── Crossbow template ──────────────────────────────────────────────────────

const CROSSBOW_TPL: Template = [
  '  I  HHHHHHH  I  ',
  '  I  HHHHHHH  I  ',
  '   I HHHHHHH I   ',
  '    IIIIIIIII     ',
  '      MMMMM       ',
  '      MMMMM       ',
  '       MMM        ',
  '       MMM        ',
  '       MMM        ',
  '       MMM        ',
  '        MM        ',
  '        MM        ',
  '        MM        ',
  '        MM        ',
]

// ── Trident template ───────────────────────────────────────────────────────

const TRIDENT_TPL: Template = [
  '    H   H   H    ',
  '    H   H   H    ',
  '    H   H   H    ',
  '    H   H   H    ',
  '    H   H   H    ',
  '    HHHHHHHH     ',
  '     HHHHHH      ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '       HH        ',
  '        H        ',
]

// ── Shield template ────────────────────────────────────────────────────────

const SHIELD_TPL: Template = [
  '   IIIIIIIIII    ',
  '   IWWWDWWWDI    ',
  '   IWDWWWDWWI    ',
  '   IWWWDWWWDI    ',
  '   IWDWWWDWWI    ',
  '   IWWWDWWWDI    ',
  '   IWDWWWDWWI    ',
  '   IWWWDWWWDI    ',
  '   IWDWWWDWWI    ',
  '    IWWWWWWI     ',
  '    IWWWWI       ',
  '     IWWI        ',
  '      II         ',
]

// ── Helmet template ────────────────────────────────────────────────────────

const HELMET_TPL: Template = [
  '    HHHHHHHH     ',
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHH    ',
  '   HHoooooHHH    ',
  '   HHHHHHHHHH    ',
]

// ── Chestplate template ────────────────────────────────────────────────────

const CHESTPLATE_TPL: Template = [
  '  HHHH    HHHH   ',
  '  HHHH    HHHH   ',
  '  HHHHHHHHHHHH   ',
  '  HHHHHHHHHHHH   ',
  '  HHHHHHHHHHHH   ',
  '  HHHHHHHHHHHH   ',
  '  HHHHHHHHHHHH   ',
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHH    ',
]

// ── Leggings template ──────────────────────────────────────────────────────

const LEGGINGS_TPL: Template = [
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
]

// ── Boots template ─────────────────────────────────────────────────────────

const BOOTS_TPL: Template = [
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHH  HHHH    ',
  '   HHHHHHHHHH    ',
  '   HHHHHHHHHHH   ',
  '   HHHHHHHHHHH   ',
]

// ── Apple shape (7 wide × 8 tall) ──────────────────────────────────────────

const APPLE_TPL: Template = [
  '       s         ',
  '      sG         ',
  '     HHHH        ',
  '    HMMMMH       ',
  '    HMMMMH       ',
  '    HMMMMH       ',
  '     HMMH        ',
  '      HH         ',
]

// ── Carrot shape (5 wide × 10 tall) ────────────────────────────────────────

const CARROT_TPL: Template = [
  '     gg          ',
  '    gggg         ',
  '     HH          ',
  '    HHHH         ',
  '    HHHH         ',
  '     HHH         ',
  '     HHH         ',
  '      HH         ',
  '      HH         ',
  '       H         ',
]

// ── Potato shape (7 wide × 6 tall) ─────────────────────────────────────────

const POTATO_TPL: Template = [
  '     HH          ',
  '    HMMH         ',
  '   HMMMMH        ',
  '   HMMMMH        ',
  '    HMMH         ',
  '     HH          ',
]

// ── Fish shape (10 wide × 5 tall) ──────────────────────────────────────────

const FISH_TPL: Template = [
  '      HHH        ',
  '  H  HMMMM       ',
  ' HH HMMMMM       ',
  '  H  HMMMM       ',
  '      HHH        ',
]

// ── Meat / steak shape (8 wide × 7 tall) ───────────────────────────────────

const MEAT_TPL: Template = [
  '    HHHH         ',
  '   HMMMMH        ',
  '  HMMMMMMH       ',
  '  HMMMMMMH       ',
  '  HMMMMMMH       ',
  '   HMMMMH        ',
  '    HHHH         ',
]

// ── Bread shape (10 wide × 5 tall) ─────────────────────────────────────────

const BREAD_TPL: Template = [
  '    HHHHHH       ',
  '   HMMMMMMH      ',
  '  HMMMMMMMMH     ',
  '   HMMMMMMH      ',
  '    HHHHHH       ',
]

// ── Pie shape (10 wide × 5 tall) ───────────────────────────────────────────

const PIE_TPL: Template = [
  '    HHHHHH       ',
  '   HMMMMMMH      ',
  '  HMMMMMMMMH     ',
  '   BBBBBBBB      ',
  '    BBBBBB       ',
]

// ── Berry cluster (7 wide × 5 tall) ────────────────────────────────────────

const BERRY_TPL: Template = [
  '    HHH          ',
  '   HHHHH         ',
  '   HHHHH         ',
  '    HHH          ',
  '     H           ',
]

// ── Cake slice (9 wide × 8 tall) ───────────────────────────────────────────

const CAKE_TPL: Template = [
  '   BBBBBBB       ',
  '   BRRRRRB       ',
  '   BWWWWWB       ',
  '   BWWWWWB       ',
  '   BWWWWWB       ',
  '   BWWWWWB       ',
  '   BBBBBBB       ',
]

// ── Compass overlay (drawn on CIRCLE_TPL) ──────────────────────────────────

function drawCompassOverlay(ctx: CanvasRenderingContext2D) {
  // needle – red top half, white bottom half
  const needle = [
    [7, 3, '#E02020'], [8, 3, '#E02020'],
    [7, 4, '#E02020'], [8, 4, '#E02020'],
    [7, 5, '#E02020'], [8, 5, '#E02020'],
    [7, 6, '#E02020'], [8, 6, '#E02020'],
    [7, 8, '#E8E8E8'], [8, 8, '#E8E8E8'],
    [7, 9, '#E8E8E8'], [8, 9, '#E8E8E8'],
    [7, 10, '#E8E8E8'], [8, 10, '#E8E8E8'],
    [7, 11, '#E8E8E8'], [8, 11, '#E8E8E8'],
    // centre dot
    [7, 7, '#333333'], [8, 7, '#333333'],
  ]
  drawPixels(ctx, needle)
}

// ── Clock overlay (drawn on CIRCLE_TPL) ────────────────────────────────────

function drawClockOverlay(ctx: CanvasRenderingContext2D) {
  const hands = [
    // hour hand (pointing ~10 o'clock)
    [7, 5, '#333333'],
    [7, 6, '#333333'],
    [7, 7, '#333333'], [8, 7, '#333333'],
    // minute hand (pointing ~2 o'clock)
    [8, 5, '#333333'],
    [9, 4, '#333333'],
    // centre
    [7, 7, '#E02020'],
  ]
  drawPixels(ctx, hands)
}

// ── Spyglass template (horizontal tube) ────────────────────────────────────

const SPYGLASS_TPL: Template = [
  '                 ',
  '                 ',
  '                 ',
  '     IIIII       ',
  '    IHMMGGB      ',
  '    IHMMGGB      ',
  '     IIIII       ',
  '                 ',
  '                 ',
  '                 ',
]

// ── Flint and steel template ───────────────────────────────────────────────

const FLINT_STEEL_TPL: Template = [
  '                 ',
  '   I             ',
  '   I        H    ',
  '   I        H    ',
  '   I        H    ',
  '   I        H    ',
  '   IHHHHHHHHH    ',
  '    SSSSSSSS     ',
  '                 ',
]

// ── Shears template ────────────────────────────────────────────────────────

const SHEARS_TPL: Template = [
  '   I        I    ',
  '    I      I     ',
  '     I    I      ',
  '      I  I       ',
  '       II        ',
  '       II        ',
  '      I  I       ',
  '     I    I      ',
  '    I      I     ',
  '   I        I    ',
  '   H        H    ',
  '    H      H     ',
]

// ── Elytra template (wing shape) ───────────────────────────────────────────

const ELYTRA_TPL: Template = [
  '   I          I  ',
  '   II        II  ',
  '   III      III  ',
  '   IIII    IIII  ',
  '   IIIII  IIIII  ',
  '   IIIIIIIIIII   ',
  '   IIIIIIIIIII   ',
  '   IIIIIIIIII    ',
  '   IIIIIIIII     ',
  '   IIIIIIII      ',
  '   IIIIIII       ',
  '   IIIIII        ',
  '   IIII          ',
  '   II            ',
]

// ── Totem template ─────────────────────────────────────────────────────────

const TOTEM_TPL: Template = [
  '    MMMMMM       ',
  '   MHMMMMH       ',
  '   MGGMMGH       ',
  '   MGGMMGH       ',
  '   MHMMMMH       ',
  '    MMMMMM       ',
  '  MM MMMMMM MM   ',
  ' MMM MMMMMM MMM  ',
  '  MM MMMMMM MM   ',
  '     MMMMMM      ',
  '     MMMMMM      ',
  '     MMMMMM      ',
  '     MM  MM      ',
  '     MM  MM      ',
  '    MMM  MMM     ',
]

// ── Bucket template ────────────────────────────────────────────────────────

const BUCKET_TPL: Template = [
  '   II  II  II    ',
  '   I  II  I      ',
  '   II  II  II    ',
  '   BBBBBBBBB     ',
  '   BMMMMMMMMB    ',
  '   BMMMMMMMMB    ',
  '   BMMMMMMMMB    ',
  '   BMMMMMMMMB    ',
  '    BBBBBBB      ',
]

// ── Map / filled map templates ─────────────────────────────────────────────

const MAP_TPL: Template = [
  '   BBBBBBBBBB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BWWWWWWWWB    ',
  '   BBBBBBBBBB    ',
]

const FILLED_MAP_TPL: Template = [
  '   BBBBBBBBBB    ',
  '   BGGWWGGWWB    ',
  '   BWWGGWWGGB    ',
  '   BGGWWGGWWB    ',
  '   BWWGGWWGGB    ',
  '   BGGWWGGWWB    ',
  '   BWWGGWWGGB    ',
  '   BGGWWGGWWB    ',
  '   BWWGGWWGGB    ',
  '   BGGWWGGWWB    ',
  '   BBBBBBBBBB    ',
]

// ── Saddle template ────────────────────────────────────────────────────────

const SADDLE_TPL: Template = [
  '    LLLLLL       ',
  '   LMMMMMML      ',
  '  LMMMMMMMMML    ',
  ' LMMMMMMMMMMML   ',
  '  LLLLLLLLLLL    ',
  '   L        L    ',
  '   L        L    ',
]

// ── Lead / rope template (diagonal with loops) ─────────────────────────────

const LEAD_TPL: Template = [
  '  LLLL           ',
  ' L    L          ',
  '  L   L          ',
  '     L           ',
  '      L          ',
  '       L         ',
  '        L        ',
  '         L       ',
  '          L      ',
  '         L   L   ',
  '        L  L L   ',
  '         L   L   ',
  '          LLL    ',
]

// ── Name tag template ──────────────────────────────────────────────────────

const NAMETAG_TPL: Template = [
  ' H WWWWWWWWW     ',
  ' H WGGGGGGGW     ',
  ' H WGGGGGGGW     ',
  ' H WGGGGGGGW     ',
  ' H WGGGGGGGW     ',
  ' H WWWWWWWWW     ',
]

// ── Dried kelp template ────────────────────────────────────────────────────

const KELP_TPL: Template = [
  '     H           ',
  '    HHH          ',
  '   HH            ',
  '    HHH          ',
  '       HH        ',
  '     HHH         ',
  '    HH           ',
  '     HHH         ',
  '       HH        ',
  '     HHH         ',
  '    HH           ',
  '     H           ',
]

// ── Arrow template (diagonal) ──────────────────────────────────────────────

const ARROW_TPL: Template = [
  '           HH    ',
  '          HHH    ',
  '           HH    ',
  '          HH     ',
  '         HH      ',
  '        HH       ',
  '       HH        ',
  '      HH         ',
  '     HH          ',
  '   GGG           ',
  '  GGG            ',
  '   GGG           ',
]

// ── Blade‑only template for tiered swords ──────────────────────────────────
// We draw the SWORD_TPL but remap H/S to blade colour, G to guard,
// and the handle/pommel separately.  The SWORD_TPL already handles
// the full layout; we just pass a colour map.

// ── Colour palettes ────────────────────────────────────────────────────────

const TIER_HEAD: Record<string, { H: string; S: string }> = {
  wood:      { H: '#BC9862', S: '#8B6B3D' },
  stone:     { H: '#808080', S: '#606060' },
  iron:      { H: '#D8D8D8', S: '#A8A8A8' },
  gold:      { H: '#FCDB4D', S: '#C8A830' },
  diamond:   { H: '#5DECF0', S: '#30B0B8' },
  netherite: { H: '#3A3238', S: '#201A20' },
  steel:     { H: '#C0CCDA', S: '#8A9AAE' },
}

const ARMOR_COLORS: Record<string, { H: string; S: string }> = {
  leather:   { H: '#8B5E3C', S: '#5A3A20' },
  chainmail: { H: '#A0A0A0', S: '#686868' },
  iron:      { H: '#D8D8D8', S: '#A0A0A0' },
  gold:      { H: '#FCDB4D', S: '#C0A030' },
  diamond:   { H: '#5DECF0', S: '#30A0A8' },
  netherite: { H: '#3A3238', S: '#201A20' },
  steel:     { H: '#C0CCDA', S: '#8A9AAE' },
}

const GUARD_COLOR = '#6B5030'
const POMMEL_COLOR = '#6B5030'
const HANDLE_COLOR = '#8B6B3D'
const HANDLE_SHADOW = '#6B4B2D'

// ── Icon generator entry point ─────────────────────────────────────────────

export function getItemIconDataUrl(itemId: string): string | null {
  if (typeof document === 'undefined') return null
  return getCachedIcon(itemId, () => generateIcon(itemId) ?? '')
}

function generateIcon(itemId: string): string | null {
  // ── Tools (pickaxe, axe, shovel, hoe) ──
  const toolMatch = itemId.match(/^(wooden|stone|iron|gold|diamond|netherite|steel)_(pickaxe|axe|shovel|hoe)$/)
  if (toolMatch) {
    const level = toolMatch[1] === 'wooden' ? 'wood' : toolMatch[1]
    const kind = toolMatch[2]
    const tier = TIER_HEAD[level]
    let headTpl: Template
    switch (kind) {
      case 'pickaxe': headTpl = PICKAXE_HEAD_TPL; break
      case 'axe':     headTpl = AXE_HEAD_TPL; break
      case 'shovel':  headTpl = SHOVEL_HEAD_TPL; break
      case 'hoe':     headTpl = HOE_HEAD_TPL; break
      default: return null
    }
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    // Draw handle first (under head)
    drawPixels(ctx, HANDLE_PIXELS)
    // Draw head on top
    const headColors: PixelMap = { H: tier.H, S: tier.S }
    drawPixels(ctx, templateToPixels(headTpl, headColors))
    return canvas.toDataURL('image/png')
  }

  // ── Swords ──
  const swordMatch = itemId.match(/^(wooden|stone|iron|gold|diamond|netherite|steel)_sword$/)
  if (swordMatch) {
    const level = swordMatch[1] === 'wooden' ? 'wood' : swordMatch[1]
    const tier = TIER_HEAD[level]
    const colors: PixelMap = {
      H: tier.H,
      S: tier.S,
      G: GUARD_COLOR,
      P: POMMEL_COLOR,
    }
    // Draw handle shadow first
    const handlePixels: Array<[number, number, string]> = [
      [7, 9, HANDLE_COLOR], [8, 9, HANDLE_COLOR],
      [6, 10, HANDLE_COLOR], [7, 10, HANDLE_COLOR],
      [5, 11, HANDLE_COLOR], [6, 11, HANDLE_COLOR],
      [4, 12, HANDLE_COLOR], [5, 12, HANDLE_COLOR],
      [3, 13, HANDLE_COLOR], [4, 13, HANDLE_COLOR],
      // shadow
      [6, 9, HANDLE_SHADOW],
      [5, 10, HANDLE_SHADOW], [6, 10, HANDLE_SHADOW],
      [4, 11, HANDLE_SHADOW], [5, 11, HANDLE_SHADOW],
      [3, 12, HANDLE_SHADOW], [4, 12, HANDLE_SHADOW],
    ]
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, handlePixels)
    drawPixels(ctx, templateToPixels(SWORD_TPL, colors))
    return canvas.toDataURL('image/png')
  }

  // ── Bow / Crossbow / Trident ──
  if (itemId === 'bow') {
    return generateDataUrl(BOW_TPL, { H: '#8B6B3D', S: '#6B4B2D' })
  }
  if (itemId === 'crossbow') {
    return generateDataUrl(CROSSBOW_TPL, { I: '#8B6B3D', H: '#808080', M: '#6B4B2D' })
  }
  if (itemId === 'trident') {
    return generateDataUrl(TRIDENT_TPL, { H: '#A0A0A0', S: '#606060' })
  }

  // ── Shield ──
  if (itemId === 'shield') {
    return generateDataUrl(SHIELD_TPL, { I: '#808080', W: '#8B6B3D', D: '#6B4B2D' })
  }

  // ── Armor ──
  const armorMatch = itemId.match(/^(leather|chainmail|iron|golden|diamond|netherite|steel)_(helmet|chestplate|leggings|boots)$/)
  if (armorMatch) {
    let rawType = armorMatch[1]
    const kind = armorMatch[2]
    // golden → gold for lookup
    if (rawType === 'golden') rawType = 'gold'
    const colors = ARMOR_COLORS[rawType]
    let tpl: Template
    switch (kind) {
      case 'helmet':     tpl = HELMET_TPL; break
      case 'chestplate': tpl = CHESTPLATE_TPL; break
      case 'leggings':   tpl = LEGGINGS_TPL; break
      case 'boots':      tpl = BOOTS_TPL; break
      default: return null
    }
    return generateDataUrl(tpl, { H: colors.H, S: colors.S, o: '#1A1A1A' })
  }

  // ── Materials: ingots ──
  const ingotColors: Record<string, PixelMap> = {
    iron_ingot:      { H: '#E8E8E8', M: '#D8D8D8', S: '#A0A0A0' },
    gold_ingot:      { H: '#FCE880', M: '#FCDB4D', S: '#C0A030' },
    copper_ingot:    { H: '#E09060', M: '#C07040', S: '#905030' },
    netherite_ingot: { H: '#504048', M: '#3A3238', S: '#201A20' },
    netherite_scrap: { H: '#504048', M: '#3A3238', S: '#201A20' },
    steel_ingot:     { H: '#D8E0EC', M: '#C0CCDA', S: '#8A9AAE' },
    brick_item:      { H: '#C07050', M: '#A05840', S: '#804030' },
    charcoal:        { H: '#484848', M: '#2A2A2A', S: '#181818' },
  }
  if (ingotColors[itemId]) {
    return generateDataUrl(INGOT_TPL, ingotColors[itemId])
  }
  if (itemId === 'coal') {
    return generateDataUrl(INGOT_TPL, { H: '#404040', M: '#2A2A2A', S: '#181818' })
  }

  // ── Materials: gems ──
  const gemColors: Record<string, PixelMap> = {
    diamond:       { H: '#90F8F8', M: '#5DECF0', S: '#30A0A8' },
    emerald:       { H: '#60E060', M: '#40C040', S: '#208020' },
    quartz:        { H: '#F8F0E0', M: '#E8E0D0', S: '#B8B0A0' },
    amethyst_shard:{ H: '#B060E0', M: '#9040C0', S: '#602080' },
    lapis_lazuli:  { H: '#4060F0', M: '#2040E0', S: '#1020A0' },
  }
  if (gemColors[itemId]) {
    return generateDataUrl(GEM_TPL, gemColors[itemId])
  }

  // ── Materials: simple powder / dots ──
  const powderColors: Record<string, PixelMap> = {
    glowstone_dust: { H: '#FCE880', M: '#FCDB4D', S: '#C0A030' },
    gunpowder:      { H: '#909090', M: '#707070', S: '#505050' },
    bone_meal:      { H: '#F8F8F8', M: '#E0E0E0', S: '#B0B0B0' },
    sugar:          { H: '#F8F8F8', M: '#E8E8E8', S: '#C0C0C0' },
    blaze_powder:   { H: '#FCE880', M: '#E0A020', S: '#A07010' },
  }
  if (powderColors[itemId]) {
    return generateDataUrl(POWDER_TPL, powderColors[itemId])
  }

  // ── Materials: specific shapes ──
  if (itemId === 'stick') {
    return generateDataUrl(
      ['                ',
       '               H',
       '              HH',
       '             HH ',
       '            HH  ',
       '           HH   ',
       '          HH    ',
       '         HH     ',
       '        HH      ',
       '       HH       ',
       '      HH        ',
       '     HH         ',
       '    HH          ',
       '   HH           ',
       '  HH            ',
       ' HH             '],
      { H: '#8B6B3D' }
    )
  }
  if (itemId === 'string') {
    return generateDataUrl(
      ['                ',
       '    W           ',
       '   W W          ',
       '  W   W         ',
       ' W     W        ',
       '  W   W         ',
       '   W W          ',
       '    W           ',
       '   W W          ',
       '  W   W         ',
       ' W     W        ',
       '  W   W         ',
       '   W W          ',
       '    W           ',
       '                ',
       '                '],
      { W: '#E8E8E8' }
    )
  }
  if (itemId === 'feather') {
    return generateDataUrl(FEATHER_TPL, { W: '#E8E8E8', S: '#A08060' })
  }
  if (itemId === 'leather') {
    return generateDataUrl(LEATHER_TPL, { L: '#6B4020', M: '#8B5E3C' })
  }
  if (itemId === 'paper') {
    return generateDataUrl(PAPER_TPL, { W: '#F0F0F0', G: '#D0D0D0', B: '#A0A0A0' })
  }
  if (itemId === 'book') {
    return generateDataUrl(BOOK_TPL, { B: '#6B4020', R: '#3040A0' })
  }
  if (itemId === 'flint') {
    return generateDataUrl(
      ['     HHH        ',
       '    HHHH        ',
       '   HHSHH        ',
       '   HHHH         ',
       '    HH          ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                '],
      { H: '#808080', S: '#606060' }
    )
  }
  if (itemId === 'clay_ball') {
    return generateDataUrl(
      ['                ',
       '     HH         ',
       '    HMMH        ',
       '   HMMMMH       ',
       '   HMMMMH       ',
       '    HMMH        ',
       '     HH         ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                '],
      { H: '#B0B8C0', M: '#9DA4AE' }
    )
  }
  if (itemId === 'ink_sac') {
    return generateDataUrl(
      ['                ',
       '     HH         ',
       '    HHHH        ',
       '   HHHHHH       ',
       '   HHHHHH       ',
       '    HHHH        ',
       '     HH         ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                '],
      { H: '#2A2A40' }
    )
  }
  if (itemId === 'blaze_rod') {
    return generateDataUrl(
      ['                ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '       HM       ',
       '       HH       ',
       '                ',
       '                '],
      { H: '#FCE880', M: '#E0A020' }
    )
  }
  if (itemId === 'ender_pearl') {
    return generateDataUrl(CIRCLE_TPL, { B: '#0A2020', M: '#105040', '.': '#208060' })
  }
  if (itemId === 'ender_eye') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    // green circle
    drawPixels(ctx, templateToPixels(CIRCLE_TPL, { B: '#0A2020', M: '#105040', '.': '#208060' }))
    // pupil
    drawPixels(ctx, [
      [7, 7, '#101010'], [8, 7, '#101010'],
      [7, 8, '#101010'], [8, 8, '#101010'],
    ])
    return canvas.toDataURL('image/png')
  }
  if (itemId === 'nether_star') {
    return generateDataUrl(
      ['        H        ',
       '       HHH       ',
       '      HMMMMH     ',
       ' H  HMMMMMMH  H  ',
       '  H HMMMMMMH H   ',
       '   HMMMMMMMMMH   ',
       '   HMMMMMMMMMH   ',
       '  H HMMMMMMH H   ',
       ' H  HMMMMMMH  H  ',
       '      HMMMMH     ',
       '       HHH       ',
       '        H        ',
       '                 ',
       '                 ',
       '                 ',
       '                 '],
      { H: '#F8F8D0', M: '#E8E0A0' }
    )
  }
  if (itemId === 'bone') {
    return generateDataUrl(
      ['    HH           ',
       '   HHHH          ',
       '   HHHH          ',
       '    HH           ',
       '     HH          ',
       '      HH         ',
       '       HH        ',
       '        HH       ',
       '         HH      ',
       '          HH     ',
       '           HH    ',
       '          HHHH   ',
       '          HHHH   ',
       '           HH    ',
       '                 ',
       '                 '],
      { H: '#E8E0D0' }
    )
  }
  if (itemId === 'wheat') {
    return generateDataUrl(WHEAT_TPL, { W: '#FCDB4D', M: '#C0A030' })
  }

  // ── Seeds ──
  const seedItems: Record<string, PixelMap> = {
    wheat_seeds:   { H: '#A0C040', M: '#80A030' },
    melon_seeds:   { H: '#C0A060', M: '#A08040' },
    pumpkin_seeds: { H: '#C0A060', M: '#A08040' },
  }
  if (seedItems[itemId]) {
    return generateDataUrl(SEED_TPL, seedItems[itemId])
  }

  // ── Arrows ──
  if (itemId === 'arrow') {
    return generateDataUrl(ARROW_TPL, { H: '#808080', G: '#E8E8E8' })
  }
  if (itemId === 'spectral_arrow') {
    return generateDataUrl(ARROW_TPL, { H: '#FCE880', G: '#E0C060' })
  }
  if (itemId === 'tipped_arrow') {
    return generateDataUrl(ARROW_TPL, { H: '#B060E0', G: '#E8E8E8' })
  }

  // ── Dyes ──
  const dyeColors: Record<string, string> = {
    white_dye: '#E8E8E8', orange_dye: '#E08040', magenta_dye: '#B040C0',
    light_blue_dye: '#6090E0', yellow_dye: '#E0D040', lime_dye: '#60D040',
    pink_dye: '#E070A0', gray_dye: '#505050', light_gray_dye: '#A0A0A0',
    cyan_dye: '#3090A0', purple_dye: '#8040B0', blue_dye: '#3040B0',
    brown_dye: '#704020', green_dye: '#407020', red_dye: '#A03030',
    black_dye: '#1A1A1A',
  }
  if (dyeColors[itemId]) {
    const c = dyeColors[itemId]
    return generateDataUrl(POWDER_TPL, { H: c, M: c })
  }

  // ── Music discs ──
  if (itemId.startsWith('music_disc_')) {
    const discMap: Record<string, PixelMap> = {
      music_disc_13: { B: '#1A1A1A', H: '#2A2A2A', D: '#1A1A1A', M: '#3A3A3A' },
      music_disc_cat: { B: '#2040A0', H: '#3050B0', D: '#1030A0', M: '#4060C0' },
    }
    return generateDataUrl(DISC_TPL, discMap[itemId] ?? discMap.music_disc_13)
  }

  // ── Food: apples ──
  if (itemId === 'apple') {
    return generateDataUrl(APPLE_TPL, { H: '#E02020', M: '#C01818', s: '#408020', G: '#306018' })
  }
  if (itemId === 'golden_apple' || itemId === 'enchanted_golden_apple') {
    return generateDataUrl(APPLE_TPL, { H: '#FCE880', M: '#FCDB4D', s: '#408020', G: '#306018' })
  }

  // ── Food: bread ──
  if (itemId === 'bread') {
    return generateDataUrl(BREAD_TPL, { H: '#C09060', M: '#A07848' })
  }

  // ── Food: meat ──
  if (itemId === 'cooked_beef' || itemId === 'cooked_porkchop' || itemId === 'cooked_chicken' || itemId === 'cooked_mutton') {
    return generateDataUrl(MEAT_TPL, { H: '#9B6B4B', M: '#7B5040' })
  }
  if (itemId === 'raw_beef' || itemId === 'raw_porkchop' || itemId === 'raw_chicken' || itemId === 'raw_mutton') {
    return generateDataUrl(MEAT_TPL, { H: '#E08080', M: '#C06060' })
  }

  // ── Food: fish ──
  if (itemId === 'cooked_cod' || itemId === 'cooked_salmon') {
    return generateDataUrl(FISH_TPL, { H: '#C09060', M: '#A07848' })
  }
  if (itemId === 'raw_cod') {
    return generateDataUrl(FISH_TPL, { H: '#A0C0D0', M: '#80A0B0' })
  }
  if (itemId === 'raw_salmon') {
    return generateDataUrl(FISH_TPL, { H: '#E08060', M: '#C06040' })
  }

  // ── Food: vegetables ──
  if (itemId === 'carrot') {
    return generateDataUrl(CARROT_TPL, { H: '#E08020', M: '#C06818', g: '#408020' })
  }
  if (itemId === 'golden_carrot') {
    return generateDataUrl(CARROT_TPL, { H: '#FCE880', M: '#FCDB4D', g: '#408020' })
  }
  if (itemId === 'potato') {
    return generateDataUrl(POTATO_TPL, { H: '#D0B880', M: '#B09868' })
  }
  if (itemId === 'baked_potato') {
    return generateDataUrl(POTATO_TPL, { H: '#C09858', M: '#A08040' })
  }
  if (itemId === 'beetroot') {
    return generateDataUrl(
      ['                ',
       '     gG         ',
       '    gggG        ',
       '     HH         ',
       '    HMMH        ',
       '    HMMH        ',
       '     HH         ',
       '      H         ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                '],
      { H: '#801040', M: '#601030', g: '#408020', G: '#306018' }
    )
  }
  if (itemId === 'melon_slice') {
    return generateDataUrl(
      ['                ',
       '    HHHH        ',
       '   HMMMMH       ',
       '   HMMMMH       ',
       '   HMMMMH       ',
       '    GGGG        ',
       '   GGGGGG       ',
       '    GGGG        ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                ',
       '                '],
      { H: '#E02020', M: '#C01818', G: '#408020' }
    )
  }

  // ── Food: cookie ──
  if (itemId === 'cookie') {
    return generateDataUrl(COOKIE_TPL, { H: '#E0B870', M: '#C09850', D: '#603020' })
  }

  // ── Food: cake ──
  if (itemId === 'cake') {
    return generateDataUrl(CAKE_TPL, { B: '#A0A0A0', R: '#E02020', W: '#F0F0F0' })
  }

  // ── Food: stews ──
  if (itemId === 'mushroom_stew' || itemId === 'beetroot_soup' || itemId === 'rabbit_stew') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(BOWL_TPL, { B: '#A0A0A0', M: '#808080' }))
    // stew surface
    const stewColor = itemId === 'beetroot_soup' ? '#A01040' : itemId === 'rabbit_stew' ? '#C09050' : '#8B5E3C'
    drawPixels(ctx, [
      [5, 1, stewColor], [6, 1, stewColor], [7, 1, stewColor], [8, 1, stewColor],
      [9, 1, stewColor], [10, 1, stewColor],
      [4, 2, stewColor], [5, 2, stewColor], [6, 2, stewColor], [7, 2, stewColor],
      [8, 2, stewColor], [9, 2, stewColor], [10, 2, stewColor], [11, 2, stewColor],
    ])
    return canvas.toDataURL('image/png')
  }

  // ── Food: pumpkin pie ──
  if (itemId === 'pumpkin_pie') {
    return generateDataUrl(PIE_TPL, { H: '#E09030', M: '#C07020', B: '#A07848' })
  }

  // ── Food: dried kelp ──
  if (itemId === 'dried_kelp') {
    return generateDataUrl(KELP_TPL, { H: '#306020', M: '#204010' })
  }

  // ── Food: sweet berries ──
  if (itemId === 'sweet_berries') {
    return generateDataUrl(BERRY_TPL, { H: '#C02040', M: '#A01830' })
  }

  // ── Utility: compass ──
  if (itemId === 'compass') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(CIRCLE_TPL, { B: '#808080', M: '#D8D8D8', '.': '#E8E8E8' }))
    drawCompassOverlay(ctx)
    return canvas.toDataURL('image/png')
  }

  // ── Utility: clock ──
  if (itemId === 'clock') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(CIRCLE_TPL, { B: '#FCDB4D', M: '#F0F0D0', '.': '#F8F8E8' }))
    drawClockOverlay(ctx)
    return canvas.toDataURL('image/png')
  }

  // ── Utility: buckets ──
  if (itemId === 'bucket') {
    return generateDataUrl(BUCKET_TPL, { I: '#A0A0A0', B: '#808080', M: '#D8D8D8' })
  }
  if (itemId === 'water_bucket') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(BUCKET_TPL, { I: '#A0A0A0', B: '#808080', M: '#3060E0' }))
    return canvas.toDataURL('image/png')
  }
  if (itemId === 'lava_bucket') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(BUCKET_TPL, { I: '#A0A0A0', B: '#808080', M: '#E06020' }))
    return canvas.toDataURL('image/png')
  }
  if (itemId === 'milk_bucket') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    drawPixels(ctx, templateToPixels(BUCKET_TPL, { I: '#A0A0A0', B: '#808080', M: '#F0F0F0' }))
    return canvas.toDataURL('image/png')
  }

  // ── Utility: fishing rod ──
  if (itemId === 'fishing_rod' || itemId === 'carrot_on_a_stick' || itemId === 'warped_fungus_on_a_stick') {
    let tipColor = '#8B6B3D'
    if (itemId === 'carrot_on_a_stick') tipColor = '#E08020'
    if (itemId === 'warped_fungus_on_a_stick') tipColor = '#30A0A0'
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    // stick diagonal
    const stickPixels: Array<[number, number, string]> = []
    for (let i = 0; i < 10; i++) {
      stickPixels.push([1 + i, 2 + i, '#8B6B3D'])
      stickPixels.push([2 + i, 2 + i, '#6B4B2D'])
    }
    drawPixels(ctx, stickPixels)
    // line + tip
    drawPixels(ctx, [
      [11, 12, '#E8E8E8'], [12, 12, '#E8E8E8'],
      [12, 13, '#E8E8E8'],
      [13, 13, tipColor], [14, 13, tipColor],
    ])
    return canvas.toDataURL('image/png')
  }

  // ── Utility: flint and steel ──
  if (itemId === 'flint_and_steel') {
    return generateDataUrl(FLINT_STEEL_TPL, { I: '#A0A0A0', H: '#2A2A2A', S: '#808080' })
  }

  // ── Utility: shears ──
  if (itemId === 'shears') {
    return generateDataUrl(SHEARS_TPL, { I: '#A0A0A0', H: '#8B6B3D' })
  }

  // ── Utility: elytra ──
  if (itemId === 'elytra') {
    return generateDataUrl(ELYTRA_TPL, { I: '#8B7060' })
  }

  // ── Utility: totem ──
  if (itemId === 'totem_of_undying') {
    return generateDataUrl(TOTEM_TPL, { M: '#40A040', H: '#308030', G: '#102010' })
  }

  // ── Utility: spyglass ──
  if (itemId === 'spyglass') {
    return generateDataUrl(SPYGLASS_TPL, { I: '#A0A0A0', M: '#6090E0', G: '#FCDB4D', B: '#808080' })
  }

  // ── Utility: map ──
  if (itemId === 'map') {
    return generateDataUrl(MAP_TPL, { B: '#8B6B3D', W: '#F0F0E0' })
  }
  if (itemId === 'filled_map') {
    return generateDataUrl(FILLED_MAP_TPL, { B: '#8B6B3D', G: '#40A040', W: '#4080C0' })
  }

  // ── Utility: saddle ──
  if (itemId === 'saddle') {
    return generateDataUrl(SADDLE_TPL, { L: '#6B4020', M: '#8B5E3C' })
  }

  // ── Utility: lead ──
  if (itemId === 'lead') {
    return generateDataUrl(LEAD_TPL, { L: '#8B6B3D' })
  }

  // ── Utility: name tag ──
  if (itemId === 'name_tag') {
    return generateDataUrl(NAMETAG_TPL, { H: '#8B6B3D', W: '#F0F0E0', G: '#D0D0C0' })
  }

  // ── Enchanted book ──
  if (itemId === 'enchanted_book') {
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
    // Closed book with magical glow
    drawPixels(ctx, [
      // Book cover
      [3, 2, '#602020'], [4, 2, '#602020'], [5, 2, '#602020'], [6, 2, '#602020'],
      [7, 2, '#602020'], [8, 2, '#602020'], [9, 2, '#602020'], [10, 2, '#602020'],
      [11, 2, '#602020'], [12, 2, '#602020'],
      [3, 3, '#803030'], [4, 3, '#803030'], [5, 3, '#803030'], [6, 3, '#803030'],
      [7, 3, '#803030'], [8, 3, '#803030'], [9, 3, '#803030'], [10, 3, '#803030'],
      [11, 3, '#803030'], [12, 3, '#803030'],
      // Pages
      [4, 4, '#F8F0D0'], [5, 4, '#F8F0D0'], [6, 4, '#F8F0D0'],
      [7, 4, '#F8F0D0'], [8, 4, '#F8F0D0'], [9, 4, '#F8F0D0'],
      [4, 5, '#F0E8C8'], [5, 5, '#F0E8C8'], [6, 5, '#F0E8C8'],
      [7, 5, '#D8C8A0'], [8, 5, '#F0E8C8'], [9, 5, '#F0E8C8'],
      [4, 6, '#E8E0C0'], [5, 6, '#E8E0C0'], [6, 6, '#E8E0C0'],
      [7, 6, '#E8E0C0'], [8, 6, '#E8E0C0'], [9, 6, '#E8E0C0'],
      [4, 7, '#F8F0D0'], [5, 7, '#F8F0D0'], [6, 7, '#F8F0D0'],
      [7, 7, '#F8F0D0'], [8, 7, '#F8F0D0'], [9, 7, '#F8F0D0'],
      [4, 8, '#F0E8C8'], [5, 8, '#F0E8C8'], [6, 8, '#F0E8C8'],
      [7, 8, '#F0E8C8'], [8, 8, '#F0E8C8'], [9, 8, '#F0E8C8'],
      // Enchanted glow (cyan particles)
      [5, 3, '#88FFFF'], [6, 9, '#88FFFF'], [12, 5, '#88FFFF'],
      [3, 4, '#AAFFFF'], [11, 8, '#AAFFFF'], [8, 2, '#CCFFFF'],
      // Spine
      [2, 2, '#401010'], [2, 3, '#401010'], [2, 4, '#401010'],
      [2, 5, '#401010'], [2, 6, '#401010'], [2, 7, '#401010'],
      [2, 8, '#401010'], [2, 9, '#401010'],
      // Bottom cover
      [4, 9, '#803030'], [5, 9, '#803030'], [6, 9, '#803030'],
      [7, 9, '#803030'], [8, 9, '#803030'], [9, 9, '#803030'],
    ])
    return canvas.toDataURL('image/png')
  }

  return null
}
