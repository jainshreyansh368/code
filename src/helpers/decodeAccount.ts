import { Connection, PublicKey } from "@solana/web3.js";
import { TokenSwapLayout } from "./tokenSwapLayout";
import { Numberu64 } from "../helpers/utils";


export const getTokenSwapStateAccountData = async (
    connection: Connection,
    address: PublicKey,
    programId: PublicKey
) => {
    const tokenSwapStateAccount = await connection.getAccountInfo(address);

    if (tokenSwapStateAccount == null) {
        throw new Error(`State account not found: ${address.toString()}`)
    }
    // @ts-ignore
    if (!tokenSwapStateAccount.owner.equals(programId)) {
        throw new Error(`State account does not associate with program: ${address.toString()}`)
    }

    const data = TokenSwapLayout.decode(tokenSwapStateAccount.data);

    if (!data.isInitialized) {
        throw new Error(`Token swap state account not initialized: ${address.toString()}`)
    }

    const poolToken = new PublicKey(data.tokenPool);
    const feeAccount = new PublicKey(data.feeAccount);
    const tokenAccountA = new PublicKey(data.tokenAccountA);
    const tokenAccountB = new PublicKey(data.tokenAccountB);
    const mintA = new PublicKey(data.mintA);
    const mintB = new PublicKey(data.mintB);
    const tokenProgramId = new PublicKey(data.tokenProgramId);

    const tradeFeeNumerator = Numberu64.fromBuffer(
        data.tradeFeeNumerator,
    );
    const tradeFeeDenominator = Numberu64.fromBuffer(
        data.tradeFeeDenominator,
    );
    const ownerTradeFeeNumerator = Numberu64.fromBuffer(
        data.ownerTradeFeeNumerator,
    );
    const ownerTradeFeeDenominator = Numberu64.fromBuffer(
        data.ownerTradeFeeDenominator,
    );
    const ownerWithdrawFeeNumerator = Numberu64.fromBuffer(
        data.ownerWithdrawFeeNumerator,
    );
    const ownerWithdrawFeeDenominator = Numberu64.fromBuffer(
        data.ownerWithdrawFeeDenominator,
    );
    const hostFeeNumerator = Numberu64.fromBuffer(
        data.hostFeeNumerator,
    );
    const hostFeeDenominator = Numberu64.fromBuffer(
        data.hostFeeDenominator,
    );
    const curveType = data.curveType;

    const dataObject = {
        tokenSwapPoolStateAccount: address.toString(),
        tokenPoolMint: poolToken.toString(),
        feeAccount: feeAccount.toString(),
        tokenAccountA: tokenAccountA.toString(),
        tokenAccountB: tokenAccountB.toString(),
        mintA: mintA.toString(),
        mintB: mintB.toString(),
        tokenProgramId: tokenProgramId.toString(),
        tradingFeeNumerator: tradeFeeNumerator,
        tradingFeeDenominator: tradeFeeDenominator,
        ownerTradingFeeNumerator: ownerTradeFeeNumerator,
        ownerTradingFeeDenominator: ownerTradeFeeDenominator,
        ownerWithdrawFeeNumerator: ownerWithdrawFeeNumerator,
        ownerWithdrawFeeDenominator: ownerWithdrawFeeDenominator,
        hostFeeNumerator: hostFeeNumerator,
        hostFeeDenominator: hostFeeDenominator,
        curveType: curveType
    }

    return dataObject;
}