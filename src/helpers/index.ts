import { addresses, EPOCH_INTERVAL, BLOCK_RATE_SECONDS, BONDS, Nested } from "../constants";
import { BigNumberish, ethers } from "ethers";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as PairContract } from "../abi/PairContract.json";

import { abi as BondOhmDaiContract } from "../abi/bonds/OhmDaiContract.json";
import { abi as BondOhmFraxContract } from "../abi/bonds/OhmFraxContract.json";
import { abi as BondDaiContract } from "../abi/bonds/DaiContract.json";
import { abi as ReserveOhmDaiContract } from "../abi/reserves/OhmDai.json";
import { abi as ReserveOhmFraxContract } from "../abi/reserves/OhmFrax.json";
import { abi as FraxBondContract } from "../abi/bonds/FraxContract.json";
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { IERC20, OlympusBondDepository } from "src/typechain";
export { default as Transactor } from "./Transactor";
import { abi as EthBondContract } from "../abi/bonds/EthContract.json";

export function addressForBond({ bond, networkID }: { bond: string; networkID: number }) {
  const bondAddresses = addresses[networkID].BONDS as Nested;
  if (bond === BONDS.ohm_dai) {
    return bondAddresses.OHM_DAI;
  }
  if (bond === BONDS.dai) {
    return bondAddresses.DAI;
  }
  if (bond === BONDS.ohm_frax) {
    return bondAddresses.OHM_FRAX;
  }
  if (bond === BONDS.frax) {
    return bondAddresses.FRAX;
  } else {
    // bond === BONDS.eth
    return bondAddresses.ETH;
  }
}

export function addressForAsset({ bond, networkID }: { bond: string; networkID: number }) {
  const reserveAddresses = addresses[networkID].RESERVES as Nested;
  if (bond === BONDS.ohm_dai) {
    return reserveAddresses.OHM_DAI;
  }
  if (bond === BONDS.dai) {
    return reserveAddresses.DAI;
  }
  if (bond === BONDS.ohm_frax) {
    return reserveAddresses.OHM_FRAX;
  }
  if (bond === BONDS.frax) {
    return reserveAddresses.FRAX;
  } else {
    // bond === BONDS.eth
    return reserveAddresses.ETH;
  }
}

export function isBondLP(bond: string) {
  return bond.indexOf("_lp") >= 0;
}

export function lpURL(bond: string) {
  if (bond === BONDS.ohm_dai)
    return "https://app.sushi.com/add/0x383518188c0c6d7730d91b2c03a03c837814a899/0x6b175474e89094c44da98b954eedeac495271d0f";
  if (bond === BONDS.ohm_frax)
    return "https://app.uniswap.org/#/add/v2/0x853d955acef822db058eb8505911ed77f175b99e/0x383518188c0c6d7730d91b2c03a03c837814a899";
}

export function bondName(bond: string) {
  if (bond === BONDS.dai) return "DAI Bond";
  if (bond === BONDS.ohm_dai) return "OHM-DAI SLP Bond";
  if (bond === BONDS.ohm_frax) return "OHM-FRAX LP Bond";
  if (bond === BONDS.frax) return "FRAX Bond";
  if (bond == BONDS.eth) return "wETH Bond";
}

// TS-REFACTOR-NOTE: it may be worthy to create a mapping in a constants file to abstract a lot of this logic out.
export function contractForBond({
  bond,
  networkID,
  provider,
}: {
  bond: string;
  networkID: number;
  provider: StaticJsonRpcProvider | JsonRpcSigner;
}) {
  const bondAddresses = addresses[networkID].BONDS as Nested;

  if (bond === BONDS.ohm_dai) {
    return new ethers.Contract(bondAddresses.OHM_DAI, BondOhmDaiContract, provider) as OlympusBondDepository;
  }
  if (bond === BONDS.dai) {
    return new ethers.Contract(bondAddresses.DAI, BondDaiContract, provider) as OlympusBondDepository;
  }
  if (bond === BONDS.ohm_frax) {
    return new ethers.Contract(bondAddresses.OHM_FRAX, BondOhmFraxContract, provider) as OlympusBondDepository;
  }
  if (bond === BONDS.frax) {
    return new ethers.Contract(bondAddresses.FRAX, FraxBondContract, provider) as OlympusBondDepository;
  } else {
    // bond === BONDS.eth
    return new ethers.Contract(bondAddresses.ETH, EthBondContract, provider) as OlympusBondDepository;
  }
}

export function contractForReserve({
  bond,
  networkID,
  provider,
}: {
  bond: string;
  networkID: number;
  provider: StaticJsonRpcProvider | JsonRpcSigner;
}) {
  const reserveAddresses = addresses[networkID].RESERVES as Nested;
  if (bond === BONDS.ohm_dai) {
    return new ethers.Contract(reserveAddresses.OHM_DAI, ReserveOhmDaiContract, provider) as IERC20;
  }
  if (bond === BONDS.dai) {
    return new ethers.Contract(reserveAddresses.DAI, ierc20Abi, provider) as IERC20;
  }
  if (bond === BONDS.ohm_frax) {
    return new ethers.Contract(reserveAddresses.OHM_FRAX, ReserveOhmFraxContract, provider) as IERC20;
  }
  if (bond === BONDS.frax) {
    return new ethers.Contract(reserveAddresses.FRAX, ierc20Abi, provider) as IERC20;
  } else {
    // bond === BONDS.eth
    return new ethers.Contract(reserveAddresses.ETH, ierc20Abi, provider) as IERC20;
  }
}

export async function getMarketPrice({ networkID, provider }: { networkID: number; provider: StaticJsonRpcProvider }) {
  const pairContract = new ethers.Contract(
    (addresses[networkID].RESERVES as Nested).OHM_DAI as string,
    PairContract,
    provider,
  );
  const reserves = await pairContract.getReserves();
  const marketPrice = reserves[1] / reserves[0];

  // commit('set', { marketPrice: marketPrice / Math.pow(10, 9) });
  return marketPrice;
}

export function shorten(str: string) {
  if (str.length < 10) return str;
  return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
}

export function trim(number: number | undefined, precision?: number) {
  if (number == undefined) {
    number = 0;
  }
  const array = number.toString().split(".");
  if (array.length === 1) return number.toString();

  array.push((array.pop() as any).substring(0, precision));
  const trimmedNumber = array.join(".");
  return trimmedNumber;
}

export function getRebaseBlock(currentBlock: number) {
  return currentBlock + EPOCH_INTERVAL - (currentBlock % EPOCH_INTERVAL);
}

export function secondsUntilBlock(startBlock: number, endBlock: number) {
  if (startBlock % EPOCH_INTERVAL === 0) {
    return 0;
  }

  const blocksAway = endBlock - startBlock;
  const secondsAway = blocksAway * BLOCK_RATE_SECONDS;

  return secondsAway;
}

export function prettyVestingPeriod(currentBlock: number, vestingBlock: number) {
  if (vestingBlock === 0) {
    return "";
  }

  const seconds = secondsUntilBlock(currentBlock, vestingBlock);
  if (seconds < 0) {
    return "Fully Vested";
  }
  return prettifySeconds(seconds);
}

export function prettifySeconds(seconds: number, resolution?: string) {
  if (seconds !== 0 && !seconds) {
    return "";
  }

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (resolution === "day") {
    return d + (d == 1 ? " day" : " days");
  }

  const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h == 1 ? " hr, " : " hrs, ") : "";
  const mDisplay = m > 0 ? m + (m == 1 ? " min" : " mins") : "";

  return dDisplay + hDisplay + mDisplay;
}

/**
 * toNum takes BigNumber type and casts it as number type.
 * For some reason it doesn't like it when you convert it
 * to string then Number(strBigNum). This normally works.
 * @param bigNum
 * @returns BigNumber type value as number type value
 */
export function toNum(bigNum: BigNumberish) {
  return bigNum as number;
}
