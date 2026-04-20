@echo off
title Lancement de l'Application IA
echo [1/2] Demarrage du serveur de developpement (npm run dev)...

:: Lance npm run dev dans une nouvelle fenêtre pour ne pas bloquer le script
start cmd /k "npm run dev"

echo [2/2] Attente du demarrage du serveur...
:: On attend quelques secondes (5 sec) pour laisser le temps au serveur de s'initialiser
timeout /t 5 /nobreak > nul

echo Ouverture du navigateur sur http://localhost:3000...
start http://localhost:3000

echo.
echo Tout est pret ! Vous pouvez fermer cette fenetre.
pause