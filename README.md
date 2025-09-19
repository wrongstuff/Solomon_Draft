# Solomon Draft App

An asynchronous Magic: The Gathering draft simulator built with TypeScript and React. This application allows players to simulate the unique draft format where players split packs into piles for their opponent to choose from.

## Features

- **Deck List Integration**: Supports Moxfield and CubeCobra URLs
- **Scryfall API Integration**: Fetches card data and images with proper rate limiting
- **Asynchronous Draft Format**: Players split packs into two piles for their opponent to choose
- **Card Organization**: Cards are automatically sorted by color identity and CMC
- **Export Functionality**: Download final deck lists in standard MTG format
- **Responsive Design**: Built for easy porting to mobile and web platforms

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SolomonApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use

1. **Load a Deck List**: Enter a Moxfield or CubeCobra URL in the input field
2. **Configure Draft Settings**: Set the pack size and number of rounds
3. **Start Drafting**: Click "Start Draft" to begin the draft
4. **Split Packs**: When it's your turn to split, click cards to assign them to Pile 1 or Pile 2
5. **Choose Piles**: When it's your turn to choose, select which pile you want
6. **Export Results**: When the draft is complete, download the final deck lists

## Draft Rules

- Each round consists of two packs (one for each player)
- The active player splits their pack into two piles (each pile must have at least one card)
- The other player chooses which pile to add to their collection
- The remaining pile goes to the splitter
- Cards are automatically organized by color identity (W, U, B, R, G, C, M) and CMC

## Technical Details

### Architecture

The application is built with a clean separation of concerns:

- **Types**: TypeScript interfaces for type safety
- **Services**: Business logic for API calls and draft mechanics
- **Components**: React components for UI
- **State Management**: React hooks for local state management

### API Integration

- **Scryfall API**: Used for card data and images with built-in rate limiting
- **Moxfield API**: For parsing Moxfield deck lists
- **CubeCobra API**: For parsing CubeCobra cube lists

### Rate Limiting

The Scryfall integration includes proper rate limiting to respect their API guidelines:
- Maximum 10 requests per second
- Automatic retry with exponential backoff
- Request queuing system

## Future Enhancements

- Multiplayer support with real-time synchronization
- Mobile app versions (iOS/Android)
- Additional deck list sources
- Card drag-and-drop functionality
- Advanced sorting and filtering options
- Draft statistics and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details



