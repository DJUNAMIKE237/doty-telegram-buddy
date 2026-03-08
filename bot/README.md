# 🐱 DOTYCAT TUNNEL - Telegram Bot

Bot Telegram pour gérer un serveur VPN DOTYCAT TUNNEL.

## Fonctionnalités

- **VLESS** : Créer, supprimer, renouveler, lister, verrouiller/déverrouiller (WS/gRPC TLS/NTLS)
- **VMESS** : Créer, supprimer, renouveler, lister, verrouiller/déverrouiller (WS/gRPC TLS/NTLS)
- **TROJAN** : Créer, supprimer, renouveler, lister, verrouiller/déverrouiller (WS/gRPC)
- **SSH** : Créer, supprimer, renouveler, lister, verrouiller/déverrouiller (WebSocket)
- **SOCKS** : Créer, supprimer, renouveler, lister (WS/gRPC)
- **OpenVPN** : Créer/supprimer clients, restart TCP/UDP, status
- **Domain** : Afficher/changer domaine, renouveler/info SSL
- **DNS/SlowDNS** : Status, restart, clé NS, config
- **Ports** : Afficher ports défaut/ouverts, changer port SSH/Squid
- **Status** : Status de tous les services, restart individuel/global, ressources serveur
- **Logs** : Xray, Nginx access/error, SSH auth, nettoyer logs
- **Backup** : Créer/restaurer backup complet (envoyé via Telegram)
- **NetGuard** : Blocker ads/torrents/adult, activer/désactiver/MAJ
- **ZIVPN** : Status, restart, config
- **UDP Custom** : Status, restart, config
- **Server Info** : IP, domain, OS, uptime, RAM, CPU
- **Update Script** : Mise à jour du script DOTYCAT

## Prérequis

- VPS Linux (Ubuntu 20/22 ou Debian 10/11) avec DOTYCAT TUNNEL installé
- Node.js 18+ installé sur le VPS
- Bot Telegram créé via @BotFather

## Installation sur VPS

```bash
# 1. Cloner le repo
git clone https://github.com/VOTRE_USER/VOTRE_REPO.git
cd VOTRE_REPO/bot

# 2. Installer les dépendances
npm install

# 3. Configurer le bot
nano config.js
# → Modifier BOT_TOKEN et ADMIN_ID

# 4. Lancer le bot
npm start
```

## Lancer en arrière-plan avec systemd

```bash
cat > /etc/systemd/system/dotybot.service << EOF
[Unit]
Description=DOTYCAT Telegram Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/VOTRE_REPO/bot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dotybot
systemctl start dotybot
```

## Commandes Telegram

- `/start` ou `/menu` — Affiche le menu principal avec tous les boutons

## ⚠️ Sécurité

- Ne partagez JAMAIS votre token bot publiquement
- Seul l'admin (ADMIN_ID) peut utiliser le bot
- Le bot exécute des commandes système — utilisez-le uniquement sur votre propre serveur
