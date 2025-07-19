const express = require('express');
const app = express();

// Route principale pour vérifier que le bot est actif
app.get('/', (req, res) => res.send('Bot is running 👋'));

// Render exige que le service écoute le port défini par la variable d’environnement
const PORT = process.env.PORT || 5000;

// Lancement du serveur Express
app.listen(PORT, () => {
  console.log(`✅ Keep-alive server actif sur le port ${PORT}`);
});
