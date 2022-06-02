import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { NftContractType } from "../lib/NftContractProvider";
import ContractArguments from "./../config/ContractArguments";
import CollectionConfig from "./../config/CollectionConfig";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(ChaiAsPromised);

enum SaleType {
  PRE_SALE = CollectionConfig.preSale.price,
  PUBLIC_SALE = CollectionConfig.publicSale.price,
}

function getPrice(saleType: SaleType, mintAmount: number) {
  return utils.parseEther(saleType.toString()).mul(mintAmount);
}

describe("MyToken44 Basic Functionality", function () {
  let owner!: SignerWithAddress;
  let presaleUser!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let contract!: NftContractType;

  before(async function () {
    [owner, presaleUser, holder, externalUser] = await ethers.getSigners();
  });

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

    expect(await contract.paused()).to.equal(true);
    expect(await contract.revealed()).to.equal(false);

    await expect(contract.tokenURI(1)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });

  it("Before any sale", async function () {
    // Nobody should be able to mint from a paused contract
    await expect(
      contract
        .connect(presaleUser)
        .mint(1, { value: getPrice(SaleType.PRE_SALE, 1) })
    ).to.be.revertedWith("The contract is paused!");

    await expect(
      contract
        .connect(holder)
        .mint(1, { value: getPrice(SaleType.PRE_SALE, 1) })
    ).to.be.revertedWith("The contract is paused!");

    await expect(
      contract.connect(owner).mint(1, { value: getPrice(SaleType.PRE_SALE, 1) })
    ).to.be.revertedWith("The contract is paused!");

    await contract.unpause();
    // The owner should always be able to run mintForAddress
    await (await contract.mintForAddress(1, await owner.getAddress())).wait();
    await (
      await contract.mintForAddress(1, await presaleUser.getAddress())
    ).wait();
    // But not over the maxMintAmountPerTx
    await expect(
      contract.mintForAddress(
        await (await contract.maxMintAmountPerTx()).add(1),
        await holder.getAddress()
      )
    ).to.be.revertedWith("Invalid mint amount!");

    // Check balances
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await presaleUser.getAddress())).to.equal(
      1
    );
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(
      0
    );
    await contract.pause();
  });

  it("Pre-sale (same as public sale)", async function () {
    await contract.setMaxMintAmountPerTx(
      CollectionConfig.preSale.maxMintAmountPerTx
    );
    // by default it is not paused
    await contract.unpause();
    await contract
      .connect(holder)
      .mint(2, { value: getPrice(SaleType.PRE_SALE, 2) });
    await contract
      .connect(presaleUser)
      .mint(1, { value: getPrice(SaleType.PRE_SALE, 1) });
    // Sending insufficient funds
    await expect(
      contract
        .connect(holder)
        .mint(1, { value: getPrice(SaleType.PRE_SALE, 1).sub(1) })
    ).to.be.rejectedWith(
      Error,
      "insufficient funds for intrinsic transaction cost"
    );
    // Sending an invalid mint amount
    await expect(
      contract
        .connect(presaleUser)
        .mint(await (await contract.maxMintAmountPerTx()).add(1), {
          value: getPrice(
            SaleType.PRE_SALE,
            await (await contract.maxMintAmountPerTx()).add(1).toNumber()
          ),
        })
    ).to.be.revertedWith("Invalid mint amount!");

    // Pause pre-sale
    await contract.pause();
    await contract.setCost(
      utils.parseEther(CollectionConfig.publicSale.price.toString())
    );
  });

  it("Owner only functions", async function () {
    await expect(
      contract
        .connect(externalUser)
        .mintForAddress(1, await externalUser.getAddress())
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setRevealed(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setCost(utils.parseEther("0.0000001"))
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setMaxMintAmountPerTx(99999)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setHiddenMetadataUri("INVALID_URI")
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setUriPrefix("INVALID_PREFIX")
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contract.connect(externalUser).setUriSuffix("INVALID_SUFFIX")
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contract.connect(externalUser).unpause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(contract.connect(externalUser).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it("Token URI generation", async function () {
    const uriPrefix = "ipfs://__COLLECTION_CID__/";
    const uriSuffix = ".json";
    const totalSupply = await contract.totalSupply();

    expect(await contract.tokenURI(0)).to.equal(
      CollectionConfig.hiddenMetadataUri
    );

    // Reveal collection
    await contract.setUriPrefix(uriPrefix);
    await contract.setRevealed(true);

    // Testing first minted token
    expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}1${uriSuffix}`);

    // Testing last unminted token
    await expect(contract.tokenURI(totalSupply)).to.be.revertedWith(
      "ERC721Metadata: URI query for nonexistent token"
    );
  });
  it("Royalty Information", async function () {
    const salePrice = getPrice(100, 1);
    const [royaltyRecepient, royaltyAmount] = await contract.royaltyInfo(
      1,
      salePrice
    );
    expect(royaltyRecepient).to.equal(
      "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
    );
    // the artist should receive 7% of the sale
    expect(royaltyAmount).to.equal(ethers.utils.parseEther("7"));
  });
});
