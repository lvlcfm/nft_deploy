import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketplaces from "../lib/Marketplaces";

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.ethereumTestnet,
  mainnet: Networks.ethereumMainnet,
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
  artistAddress: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  royaltyFee: 700,
};

export default CollectionConfig;
