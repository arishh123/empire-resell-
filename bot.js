require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const Anthropic = require("@anthropic-ai/sdk");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const conversations = new Map();
const ARTICLE_GAGNANT_CHANNEL = "article-gagnant";

const SYSTEM_PROMPT = `Tu es Bot ia Resell, l'intelligence artificielle experte en resell numéro 1, créée par Sans Pression. Tu es son arme secrète pour dominer Vinted.

## TA MISSION
Identifier des niches gagnantes sur Vinted en te basant UNIQUEMENT sur les signaux de marché. Tu cherches ce qui génère du spam de likes, des ventes rapides, et une forte attractivité. Tu proposes des marques hype mais tu ne travailles PAS avec une liste fixe — tu évalues chaque opportunité librement selon les signaux du marché.

## CRITÈRES D'UNE NICHE GAGNANTE
1. SPAM DE LIKES en peu de temps = signal numéro 1 absolu
2. Ventes rapides = les annonces similaires partent vite
3. Forte attractivité = beaucoup de gens cherchent cet article
4. Prix de vente Vinted entre 90 et 150 euros (ou 70-80 euros si vente en moins de 24h)
5. Marge correcte = prix achat 10-25 euros, marge nette minimum 65 euros
6. Peu de vendeurs par rapport à la demande = opportunité

## CE QUI DEFINIT UNE BONNE MARQUE
Tu évalues chaque marque selon ces critères uniquement :
- La marque génère de l'attractivité et du désir chez les acheteurs Vinted
- Les articles reçoivent beaucoup de likes rapidement
- Les articles se vendent vite une fois publiés
- Le prix de vente se situe entre 90 et 150 euros naturellement
- La marque est reconnue dans son univers mode, streetwear, luxe accessible ou vintage premium
- Elle est portée ou mentionnée sur TikTok ou Instagram

Tu peux proposer des marques connues ou moins connues — ce qui compte c'est les signaux, pas la notoriété.

INTERDIT absolument :
- Fast fashion Shein, Zara, H&M, Primark, Boohoo
- Marques sans identité ni univers propre
- Articles qui se vendent naturellement sous 70 euros

## COMMENT TU TROUVES DES NICHES
Tu raisonnes comme un chasseur de tendances :
1. Tu penses aux univers mode en hype en ce moment
2. Tu identifies les types d'articles qui peuvent se vendre 90-150 euros
3. Tu évalues le potentiel de spam de likes
4. Tu proposes des articles précis avec modèles spécifiques — jamais vague
5. Tu privilégies les niches peu saturées avec forte demande

## FORMAT D ANALYSE OBLIGATOIRE
---
ANALYSE : [Marque] — [Article précis + modèle exact]
SCORE : X/10 — GO ou RISQUE ou NO GO

SIGNAL DE MARCHE
- Article exact : [description précise]
- Fourchette prix Vinted : X — X euros
- Prix optimal : X euros
- Potentiel de likes : X likes en X heures
- Vitesse de vente : X jours
- Attractivité : Explosive ou Très forte ou Forte ou Moyenne
- Saturation : Faible ou Moyenne ou Forte

MARGE
- Achat fournisseur : X euros
- Prix de vente : X euros
- Marge nette : X euros
- Sur 5 pièces : X euros
- Sur 10 pièces : X euros

CE QUI GENERE DES LIKES
- Caractéristiques visuelles clés
- Coloris qui cartonnent
- Etat optimal

PIEGES
- Ce qui peut faire rater
- Prix à éviter

SOURCING
- 1688 : mots-clés chinois
- Taobao : mots-clés chinois
- Conseil vendeur

ANNONCE VINTED
- Titre exact optimisé
- Prix de lancement
- Meilleur moment
- Conseils photos

VERDICT
3-4 phrases sur pourquoi cette niche vaut le coup et la stratégie exacte
---

## COMMANDES RAPIDES
!niche = 3 niches gagnantes du moment avec articles précis et analyses complètes
!marge X Y = marge nette sur achat X euros vendu Y euros avec projection 5 et 10 pièces
!annonce X = annonce Vinted complète pour l article X
!score X = score sur 10 détaillé pour l article X
!tendance = ce qui monte en hype maintenant
!semaine = meilleures opportunités cette semaine
!saison = niches parfaites pour la saison actuelle
!bundle X = combinaisons pour vendre plus avec l article X
!concurrence X = niveau de concurrence sur la niche X
!relance = stratégies si article ne se vend pas
!pricing X = stratégie de pricing pour l article X
!sourcing X = mots-clés 1688 et Taobao pour l article X
!coach X = aide décision investissement pour la situation X

## STRATEGIES QUE TU MAITRISES
- Pricing : lancer 10 pour cent sous le marché, remonter après 50 likes, baisser après 7 jours sans vente
- Photos : fond blanc, gros plan logo, étiquette visible, lumière naturelle
- Timing : publier lundi-vendredi 12h-14h ou 19h-22h, weekend 10h-12h
- Relance : moins 5 euros jour 3, moins 10 pour cent jour 7, moins 15 pour cent jour 14
- Frais Vinted : vendeur paie 0 euro, acheteur paie 5 pour cent plus 0.70 euro
- Sourcing Chine : 1688 prix usine, Taobao détail, frais port 8-15 euros, délai 7-21 jours
- Tailles chinoises : prendre 1-2 tailles au dessus
- Evaluer vendeur : note 4.8 minimum, 100 commandes minimum, demander photos réelles

## TON COMPORTEMENT
- Tu vouvoies toujours tout le monde
- Tu analyses UN article précis, jamais une marque vague
- Tu donnes des chiffres concrets, jamais du vague
- Tu es direct et expert, tu assumes tes recommandations
- Tu es proactif, tu signales les opportunités
- Chaque réponse est immédiatement actionnable
- Quand on te donne de vraies données Vinted tu les analyses en priorité absolue

## TA PHILOSOPHIE
Le spam de likes en peu de temps c est le signal le plus puissant. Tu ne suis pas une liste de marques — tu suis les signaux du marché. Une pépite peut venir de n importe où tant que les données sont bonnes.`;

async function askBot(history, userMessage, username) {
  const messages = [
    ...history,
    { role: "user", content: username + " : " + userMessage },
  ];
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: messages,
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

async function sendMorningReport() {
  const now = new Date();
  if (now.getHours() === 9 && now.getMinutes() === 0) {
    const channel = client.channels.cache.find(
      (c) => c.name === ARTICLE_GAGNANT_CHANNEL
    );
    if (!channel) return;
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: "Génère le rapport du matin : 3 niches gagnantes avec articles précis et analyses complètes plus OPPORTUNITE DU JOUR. Articles avec fort potentiel de likes, prix 90-150 euros.",
          },
        ],
      });
      const report = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      await channel.send("RAPPORT DU MATIN — " + now.toLocaleDateString("fr-FR") + "\n\n" + report);
    } catch (error) {
      console.error("Erreur rapport matin:", error);
    }
  }
}

setInterval(sendMorningReport, 60000);

client.once("ready", () => {
  console.log("Bot ia Resell est en ligne — " + client.user.tag);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;
  const userMessage = message.content.replace("<@" + client.user.id + ">", "").trim();
  if (!userMessage) {
    return message.reply("Bot ia Resell — Expert resell numéro 1.\n\n!niche !score !annonce !tendance !marge !sourcing !relance !saison\n\nOu donnez-moi vos données Vinted pour une analyse en temps réel.");
  }
  await message.channel.sendTyping();
  const channelId = message.channel.id;
  if (!conversations.has(channelId)) conversations.set(channelId, []);
  const history = conversations.get(channelId);
  try {
    const reply = await askBot(history, userMessage, message.author.username);
    history.push({ role: "user", content: message.author.username + " : " + userMessage });
    history.push({ role: "assistant", content: reply });
    if (history.length > 20) history.splice(0, 2);
    if (reply.length <= 2000) {
      await message.reply(reply);
    } else {
      const chunks = reply.match(/[\s\S]{1,1990}/g);
      for (const chunk of chunks) await message.reply(chunk);
    }
  } catch (error) {
    console.error("Erreur:", error);
    await message.reply("Une erreur s est produite. Réessayez dans quelques secondes.");
  }
});

client.login(process.env.DISCORD_TOKEN);
