import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { NftContractType } from "../lib/NftContractProvider";
import ContractArguments from "./../config/ContractArguments";
import CollectionConfig from "./../config/CollectionConfig";

enum SaleType {
  PRE_SALE = CollectionConfig.preSale.price,
  PUBLIC_SALE = CollectionConfig.publicSale.price,
}

function getPrice(saleType: SaleType, mintAmount: number) {
  return utils.parseEther(saleType.toString()).mul(mintAmount);
}

describe("MyToken44 Basic Functionality", function () {
  let contract!: NftContractType;
  it("Should deploy and check it supports Royalties", async function () {
    const Contract = await ethers.getContractFactory("MyToken44");
    contract = (await Contract.deploy(...ContractArguments)) as NftContractType;
    await contract.deployed();

    expect(await contract.name()).to.equal("My Token 44");
    expect(await contract.symbol()).to.equal("MTFF");

    // check it supports royalties
    expect(await contract.supportsInterface("0x2a55205a")).to.equal(true);
  });
  it("Check initial data", async function () {
    expect(await contract.name()).to.equal(CollectionConfig.tokenName);
    expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
    expect(await contract.cost()).to.equal(getPrice(SaleType.PRE_SALE, 1));
    expect(await contract.maxSupply()).to.equal(CollectionConfig.maxSupply);
    expect(await contract.maxMintAmountPerTx()).to.equal(
      CollectionConfig.preSale.maxMintAmountPerTx
    );
    expect(await contract.hiddenMetadataUri()).to.equal(
      CollectionConfig.hiddenMetadataUri
    );

    expect(await contract.paused()).to.equal(false);
    expect(await contract.revealed()).to.equal(false);

    await expect(contract.tokenURI(1)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });
});
