# Mintr
A simple web app for minting NFTs.

## Connect With Us

- Follow us on [Twitter](https://twitter.com/NFTr_pro) for the latest updates and news.
- Join our [Discord community](https://discord.gg/j7PmvGv5ra) to connect with other users and ask questions.

We'd love to hear your feedback and suggestions!

## Getting started

- **The latest version** of Mintr can be accessed at [mintr.nftr.pro](https://mintr.nftr.pro/).
- **Demo videos** are available on [YouTube](https://youtube.com/playlist?list=PLZUsReyKnIP5lFfBxZ87r7pwC2vbea2n4).


Before using Mintr to mint NFTs you will need to set up a few things first:

1. **Download, install and run** Chia in wallet mode (Farming mode/full node is required for bulk nft minting) 
    [Chia Downloads](https://chia.net/download)

2. **Get free XCH** from Chia's official source.
    [Chia Faucet](https://faucet.chia.net/)

3.  **Create your DID and NFT wallets**. You can follow this YouTube tutorial from the xch foundation.
    [NFT1 (Chia) Minting tutorial](https://www.youtube.com/watch?v=582v0wSsoiU)

4.  **Get your API key** for uploading to IPFS using Mintr's "basic" mode.
    [NFT.storage](https://nft.storage)

5.  **Create a Collection ID** (UUID v4) for your collection.
    [UUID Generator](https://www.uuidgenerator.net/version4)

## Features
The following table lists the features supported by Mintr-Beta, with indicators of whether they are available in the Basic and Pro versions.
The beta includes all basic and pro features.
|                                                          | Basic    | Pro      |
|----------------------------------------------------------|----------|----------|
| Fully decentralized                                      | &#x2713; | &#x2713; |
| Create NFTs and collections from scratch                 | &#x2713; | &#x2713; |
| Import partially or fully complete NFTs and Collections  | &#x2713; | &#x2713; |
| Autofill or manually create metadata for each NFT        | &#x2713; | &#x2713; |
| Upload all assets, metadata, and licenses to IPFS        | &#x2713; | &#x2713; |
| Validate all assets and their hashes                     | &#x2713; | &#x2713; |
| Mint NFTs on Chia                                        | &#x2713; | &#x2713; |
| Monitor progress of each process                         | &#x2713; | &#x2713; |
| Supports all assets (image, video, 3D object, json, etc) | &#x2713; | &#x2713; |
| Batch operations                                         |          | &#x2713; |
| Multi-component assets                                   |          | &#x2713; |
| Media transcoding                                        |          | &#x2713; |
| Rarity scoring                                           |          | &#x2713; |
| Open-standards                                           |          | &#x2713; |
| Sell offer creation                                      |          | &#x2713; |
| Full catalog search and sort                             |          | &#x2713; |
| Theming and optimizations                                |          | &#x2713; |

## Technical Overview

Mintr uses IndexedDB to store everything including thumbnails, metadata, user data, and state on your local device's browser.

#### Tech Stack
- JavaScript
- IndexedDb
- WebAssembly

#### Requirements
- The source code from this repo
- An HTTP Server running locally or hosted anywhere.
- Any modern browser that supports IndexedDB (Firefox is much faster than Chrome at this time. 04/23) and WebAssembly (for FFMPEG transcoding support)


## Resources

### [Chia's NFT Developer Guide](https://devs.chia.net/guides/nft-developer-guide/)

Chia's official documentation, including step-by-step instructions for getting started.


### [JSON Schema Validator](https://jsonschemavalidator.net/s/0Aw7Bmlb)

A JSON validator with the Chia NFT metadata schema loaded.

## Source Code

### [mintr](https://github.com/SumSet-Tech/mintr)

The source code for this web app on GitHub.
