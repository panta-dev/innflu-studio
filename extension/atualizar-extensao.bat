@echo off
chcp 65001 > nul
title Innflu Studio - Atualizador Automático de Extensão
color 0B
echo.
echo ========================================================
echo       INNFLU STUDIO — ATUALIZADOR AUTOMÁTICO
echo ========================================================
echo.
echo [1/3] Conectando ao servidor oficial (Cloudflare Pages)...
echo [2/3] Baixando a versão mais recente da extensão...

set "TARGET_DIR=%~dp0"
set "TEMP_ZIP=%TEMP%\innflu-extensao-latest.zip"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://innflu-studio.pages.dev/innflu-extensao.zip', '%TEMP_ZIP%')"

if not exist "%TEMP_ZIP%" (
    echo.
    echo [ERRO] Falha ao baixar pacote de atualização do servidor.
    echo Verifique sua conexão com a internet e tente novamente.
    pause
    exit /b 1
)

echo [3/3] Aplicando arquivos atualizados na pasta...
powershell -Command "Expand-Archive -Path '%TEMP_ZIP%' -DestinationPath '%TARGET_DIR%' -Force"
del /f /q "%TEMP_ZIP%" > nul 2>&1

echo.
echo ========================================================
echo   ✅ EXTENSÃO ATUALIZADA COM SUCESSO!
echo ========================================================
echo.
echo No seu Google Chrome:
echo 1. Abra: chrome://extensions
echo 2. Clique no ícone de recarregar (↻) na extensão Innflu.
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
