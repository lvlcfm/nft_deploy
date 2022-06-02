import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketplaces from "../lib/Marketplaces";

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.ethereumTestnet,
  mainnet: Networks.ethereumMainnet,
  // The contract name can be updated using the following command:
  // yarn rename-contract NEW_CONTRACT_NAME
  // Please DO NOT change it manually!
  contractName: "MyToken44",
  tokenName: "My Token 44",
  tokenSymbol: "MTFF",
  hiddenMetadataUri: "ipfs://__CID__/hidden.json",
  maxSupply: 777,
  preSale: {
    price: 0.14,
    maxMintAmountPerTx: 4,
  },
  publicSale: {
    price: 0.17,
    maxMintAmountPerTx: 7,
  },
  contractAddress: null,
  marketplaceIdentifier: "my-token-44",
  marketplaceConfig: Marketplaces.openSea,
  artistAddress: "0x92F5148a053058AE74A614B30B317748f071B8DC",
  royaltyFee: 700,
};

export default CollectionConfig;
