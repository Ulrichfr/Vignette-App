# Partager une note

Une note se partage **par email**, entre comptes de la même instance.

## Inviter

Sur une note dont tu es propriétaire : **Partager** → saisis l'email, choisis
le rôle, **Inviter**.

- **Édition** : la personne peut cocher, écrire, renommer — mais ni supprimer
  la note, ni la repartager.
- **Lecture** : elle voit la note vivre en temps réel, sans pouvoir la toucher.

Le panneau liste qui a accès (avec « en attente » tant que l'invitation n'est
pas acceptée) et permet de **Retirer** quelqu'un.

## Accepter

Chez la personne invitée, l'invitation apparaît en haut de l'écran comme un
petit post-it jaune : « Untel partage “Courses” » — **Accepter** ou
**Refuser**. Une fois acceptée, la note apparaît dans sa liste et son deck,
synchronisée à la seconde : un item coché d'un côté se barre de l'autre.

## Quitter

La personne invitée peut **Quitter la note** à tout moment (à la place du
bouton Supprimer, réservé au propriétaire). Le propriétaire peut la retirer
depuis le panneau Partager.

## Sous le capot

L'isolation est garantie par la Row Level Security de Postgres : chaque
requête est filtrée par la base elle-même, pas par le client. Une invitation
non acceptée ne donne accès à rien ; un rôle Lecture ne peut pas écrire ;
seul le propriétaire supprime ou repartage. Les tests du dépôt couvrent ces
invariants.
