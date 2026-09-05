$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$py=Get-Command py -ErrorAction SilentlyContinue
if(-not $py){$py=Get-Command python -ErrorAction SilentlyContinue}
if(-not $py){throw 'Python was not found.'}
& $py.Source (Join-Path $root 'verify-build.py') @args
exit $LASTEXITCODE
