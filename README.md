# Jours Restants

Entrez votre date de naissance et découvrez combien de jours il vous reste à vivre avec 50 % de chance. Une manière élégante de rappeler à vos amis que leur compte à rebours tourne aussi.

## Comment ça marche

- Les quotients de mortalité par sexe et âge (table DEC3, données 2025 provisoires) de l'INSEE sont intégrés directement dans la page, sur https://www.insee.fr/fr/statistiques/8999019
- À partir de votre âge exact, la page calcule votre probabilité de survie année par année et remonte l'âge auquel il ne vous reste statistiquement que 50 % de chances d'être en vie (l'espérance de vie médiane, pas la moyenne).
- Le tout en JavaScript pur, dans un seul fichier `index.html`. Aucun serveur, aucune donnée envoyée : votre date de naissance ne quitte jamais votre navigateur, ce qui est la moindre des politesses pour une information pareille.

## Utilisation

Ouvrez simplement `index.html` dans n'importe quel navigateur.

## Avertissements

- Table du moment (périodique) : elle suppose que la mortalité de 2025 reste valable toute votre vie. Spoiler : elle va probablement continuer de s'améliorer, donc le chiffre affiché est pessimiste. Savourez cette bonne nouvelle.
- Ceci n'est ni un pronostic médical, ni une excuse pour ne pas faire de sport.
