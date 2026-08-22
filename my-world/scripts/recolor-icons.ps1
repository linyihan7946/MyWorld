# 用官方铁质贴图改色生成自定义物品图标 (钢 / 铜装备)
# 原版 Minecraft 没有钢和铜工具/盔甲, 用官方铁质贴图按目标金属色调色
# 用法: powershell -File scripts/recolor-icons.ps1
Add-Type -AssemblyName System.Drawing

$dir = 'src\assets\item-icons'

function Recolor($src, $dst, $rMul, $gMul, $bMul) {
  if (-not (Test-Path $src)) { Write-Output "SKIP (no base): $src"; return }
  $img = [System.Drawing.Image]::FromFile((Resolve-Path $src))
  $bmp = New-Object System.Drawing.Bitmap($img)
  $img.Dispose()
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -eq 0) { continue }
      $r = [Math]::Min(255, [int]($c.R * $rMul))
      $g = [Math]::Min(255, [int]($c.G * $gMul))
      $b = [Math]::Min(255, [int]($c.B * $bMul))
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, $r, $g, $b))
    }
  }
  $bmp.Save((Join-Path (Resolve-Path $dir) $dst), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "OK: $dst"
}

# ── 钢 (深蓝灰): 比铁更暗、偏冷色 ──
$steelR = 0.70; $steelG = 0.74; $steelB = 0.88

Recolor "$dir\iron_ingot.png"    'steel_ingot.png'    $steelR $steelG $steelB
Recolor "$dir\iron_block.png"    'steel_block.png'    $steelR $steelG $steelB
Recolor "$dir\iron_pickaxe.png"  'steel_pickaxe.png'  $steelR $steelG $steelB
Recolor "$dir\iron_axe.png"      'steel_axe.png'      $steelR $steelG $steelB
Recolor "$dir\iron_shovel.png"   'steel_shovel.png'   $steelR $steelG $steelB
Recolor "$dir\iron_hoe.png"      'steel_hoe.png'      $steelR $steelG $steelB
Recolor "$dir\iron_sword.png"    'steel_sword.png'    $steelR $steelG $steelB
Recolor "$dir\iron_helmet.png"   'steel_helmet.png'   $steelR $steelG $steelB
Recolor "$dir\iron_chestplate.png" 'steel_chestplate.png' $steelR $steelG $steelB
Recolor "$dir\iron_leggings.png" 'steel_leggings.png' $steelR $steelG $steelB
Recolor "$dir\iron_boots.png"    'steel_boots.png'    $steelR $steelG $steelB
Recolor "$dir\iron_ore.png"      'steel_ore.png'      $steelR $steelG $steelB

# ── 铜 (橙铜色 #B87333): 原版无铜工具/盔甲, 按铜锭色感调 ──
$copperR = 0.96; $copperG = 0.58; $copperB = 0.32

Recolor "$dir\iron_pickaxe.png"  'copper_pickaxe.png'  $copperR $copperG $copperB
Recolor "$dir\iron_axe.png"      'copper_axe.png'      $copperR $copperG $copperB
Recolor "$dir\iron_shovel.png"   'copper_shovel.png'   $copperR $copperG $copperB
Recolor "$dir\iron_hoe.png"      'copper_hoe.png'      $copperR $copperG $copperB
Recolor "$dir\iron_sword.png"    'copper_sword.png'    $copperR $copperG $copperB
Recolor "$dir\iron_helmet.png"   'copper_helmet.png'   $copperR $copperG $copperB
Recolor "$dir\iron_chestplate.png" 'copper_chestplate.png' $copperR $copperG $copperB
Recolor "$dir\iron_leggings.png" 'copper_leggings.png' $copperR $copperG $copperB
Recolor "$dir\iron_boots.png"    'copper_boots.png'    $copperR $copperG $copperB
