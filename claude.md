I would like to implement an asynchronous draft application for Magic:the Gathering, in typescript. 

The app will take as input a moxfield deck list (mainboard) or a cubecobra list (mainboard) and the cards that exist in it. When displaying cards or needing information about them, the scryfall api should be utilzed to query for these cards, and pull the associated metadata + art for display.
- The art to display is under the image_uris.png, and other meta data about the card exists. We will need to keep in mind the color identity and mana cost especially.
- Lists will have some number of cards in it: cardsInList
- when drafting, a selection of these cards will be used for the draft pool: cardsInPool. The number of cards in the pool can be set by the players. This pool is randomized from the cardsInList, and cardsInPool < cardsInList. This will have a unique "seed" associated with it, so it can be shared with other players for them to also draft. 
- when drafting, cards from the pool will be selected to draft (shuffle the cardsInPool). Players will at the beginning of the draft, determine the sizeOfPacks(default to 6), and the number of rounds they will draft(numberOfRounds). The number of cards in the pool must be evenly divisible by 2 * size of packs. For example, if we set packSize=6 and numberOfRounds=15, we get a total pool size of 2 * 6 * 15 = 180. Poolsize is derived from numberOfPacks and packsize (which are params players can change)
- Each round consists of player1 drawing a new pack from the pool (at which point, they are removed from the pool of available cards for the rest of the draft), and separates them into 2 piles (piles do not need to be equal size). After separating, P2 picks which pile to add to their pool of cards. P2 then gets a new pack, separates them into piles for p1 to then choose, and add to p1's pool. This is the structure of a round (2 packs per round).

I would like to build a typescript app with a front end that can run locally in a browser to simulate this game. For now, a single player will simulate both players (so while there is a display saying what turn it is, there's no connectivity between game clients yet. That will be a future detail, so just code that we will lift + shift our front end later, so keep the functional code underneath portable).
The front end should display:
- Inputs for:
  - a cubecobra or moxfield link, and a "submit" button
  - packsize
  - number of rounds
  - a "start" draft button 
- Who's turn it is (p1/p2) whats the round number (e.g. Round: 1/15, P1-split/P2-choose or P1-choose/P2-split). We may change the display of this later so keep it extensible. 
- how many cards are left in the pool
- An area for P1's picks, and and area for P2's picks. Cards should be default sorted into columns similar to how it is in "stacked cards.png". They should be ordered in mana value, descending, in color oriented columns. Columns in order should be W, U, B, R, G, colorless, gold. Use the card's color identity metadata to sort them into the correct column, and order the column vertically by having the lowest CMC on top, alphabetically. Future enhancement: allow users to drag cards from one column to another, and reorder cards in general. Allow a button to reset the "default sort". In the future, we may add others. 
- Each column should have a count of cards next to it e.g. W=7 U=0 We may change the display later but for now lets keep it simple, but extensible
- We should have a section that is the "draft". the pack is displayed, and the active player separates those cards into 2 piles. Each pile must have at least one card in it, and all cards must be assigned to a pile before the player can "submit" their piles. Include a button to submit. Include a "confirm" prompt / "are you sure"
- The next player then can choose one of the two piles, and similarly gets a confirm prompt. Upon picking, the cards the player chose are placed into their pool, and the other pile is given to the "splitter". 
- A new pack is then dealt. Leave room for some animation here

When the draft is complete, allow both player's lists to be exported as a txt file