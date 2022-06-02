import { utils } from "ethers";
import CollectionConfig from "./CollectionConfig";

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol,
  utils.parseEther(CollectionConfig.preSale.price.toString()),
  CollectionConfig.maxSupply,
  CollectionConfig.preSale.maxMintAmountPerTx,
  CollectionConfig.hiddenMetadataUri,
  CollectionConfig.artistAddress,
  CollectionConfig.royaltyFee,
] as const;

export default ContractArguments;
