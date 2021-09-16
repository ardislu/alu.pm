const hre = require('hardhat');
const ethers = hre.ethers;

async function main() {
  const Access = await ethers.getContractFactory('AluAccessToken');
  const access = await Access.deploy();

  await access.deployed();

  console.log('AluAccessToken deployed to:', access.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });