# Configura variables de soporte en Vercel (requiere: npx vercel login)
# Ejecutar desde la raíz del proyecto:
#   .\scripts\vercel-env-support.ps1

$vars = @{
  "NEXT_PUBLIC_SUPPORT_NAME" = "GABAN Solutions"
  "NEXT_PUBLIC_SUPPORT_TAGLINE" = "Soporte técnico, actualizaciones y nuevas funciones"
  "NEXT_PUBLIC_SUPPORT_URL" = "https://gabansolutions.ca"
  "NEXT_PUBLIC_SUPPORT_EMAIL" = "gabansolutions@gmail.com"
  "NEXT_PUBLIC_SUPPORT_PHONE" = "(514) 258-0648"
  "NEXT_PUBLIC_SUPPORT_WHATSAPP" = "15142580648"
}

foreach ($key in $vars.Keys) {
  Write-Host "Setting $key ..."
  $vars[$key] | npx vercel env add $key production --force 2>$null
  $vars[$key] | npx vercel env add $key preview --force 2>$null
  $vars[$key] | npx vercel env add $key development --force 2>$null
}

Write-Host "Done. Redeploy en Vercel para aplicar cambios."
