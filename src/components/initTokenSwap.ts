import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey, TransactionInstruction } from "@solana/web3.js"
import { TokenSwapLayout } from "../helpers/tokenSwapLayout";
import { TOKEN_A_MINT, TOKEN_B_MINT, VALHALLA_TOKEN_SWAP_PROGRAM_ID } from "../helpers/id";
import { Numberu64, CurveType } from "../helpers/utils";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as BufferLayout from '@solana/buffer-layout';
import { getTokenSwapStateAccountData } from "../helpers/decodeAccount";
import { publicKey } from '../helpers/layout';

export const initTokenSwap = async (
    connection: Connection,
    payer: Keypair,
    owner: Keypair,
    swapInfo: Keypair,
    tradeFeeNumerator: number,
    tradeFeeDenominator: number,
    ownerTradeFeeNumerator: number,
    ownerTradeFeeDenominator: number,
    ownerWithdrawFeeNumerator: number,
    ownerWithdrawFeeDenominator: number,
    hostFeeNumerator: number,
    hostFeeDenominator: number,
    authority: PublicKey,
    tokenAAccount: PublicKey,
    tokenBAccount: PublicKey,
    curveType: number,
    curveParams: Numberu64
) => {
    const lpTokenMint = await Token.createMint(
        connection,
        payer,
        authority,
        null,
        2,
        TOKEN_PROGRAM_ID,
    );

    const lpTokenAccount = await lpTokenMint.createAccount(owner.publicKey);
    const feeAccount = await lpTokenMint.createAccount(owner.publicKey);

    let transaction = new Transaction();

    const createSwapInfoAccountIX = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: swapInfo.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(TokenSwapLayout.span),
        space: TokenSwapLayout.span,
        programId: VALHALLA_TOKEN_SWAP_PROGRAM_ID,
    });
    console.log("token A",tokenAAccount.toString())
    transaction.add(createSwapInfoAccountIX)

    const pdaTokenAAccount = new Keypair();
    const pdaTokenBAccount = new Keypair();

    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: pdaTokenAAccount.publicKey,
            space: AccountLayout.span,
            lamports: await Token.getMinBalanceRentForExemptAccount(connection),
            programId: TOKEN_PROGRAM_ID
        }),

        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            TOKEN_A_MINT,
            pdaTokenAAccount.publicKey,
            authority
        ),

        Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            tokenAAccount,
            pdaTokenAAccount.publicKey,
            owner.publicKey,
            [],
            1000
        ),

        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: pdaTokenBAccount.publicKey,
            space: AccountLayout.span,
            lamports: await Token.getMinBalanceRentForExemptAccount(connection),
            programId: TOKEN_PROGRAM_ID
        }),
        
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            TOKEN_B_MINT,
            pdaTokenBAccount.publicKey,
            authority
        ),

        Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            tokenBAccount,
            pdaTokenBAccount.publicKey,
            owner.publicKey,
            [],
            1000
        )
    );
    const keys = [
        { pubkey: swapInfo.publicKey, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: pdaTokenAAccount.publicKey, isSigner: false, isWritable: false },
        { pubkey: pdaTokenBAccount.publicKey, isSigner: false, isWritable: false },
        { pubkey: lpTokenMint.publicKey, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: false },
        { pubkey: lpTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    const commandDataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        BufferLayout.nu64('tradeFeeNumerator'),
        BufferLayout.nu64('tradeFeeDenominator'),
        BufferLayout.nu64('ownerTradeFeeNumerator'),
        BufferLayout.nu64('ownerTradeFeeDenominator'),
        BufferLayout.nu64('ownerWithdrawFeeNumerator'),
        BufferLayout.nu64('ownerWithdrawFeeDenominator'),
        BufferLayout.nu64('hostFeeNumerator'),
        BufferLayout.nu64('hostFeeDenominator'),
        BufferLayout.u8('curveType'),
        BufferLayout.blob(32, 'curveParameters'),
    ]);
    let data = Buffer.alloc(1024);

    let curveParamsBuffer = Buffer.alloc(32);
    curveParams.toBuffer().copy(curveParamsBuffer);

    {
        const encodeLength = commandDataLayout.encode(
            {
                instruction: 0,
                tradeFeeNumerator: new Numberu64(tradeFeeNumerator),
                tradeFeeDenominator: new Numberu64(tradeFeeDenominator),
                ownerTradeFeeNumerator: new Numberu64(ownerTradeFeeNumerator),
                ownerTradeFeeDenominator: new Numberu64(ownerTradeFeeDenominator),
                ownerWithdrawFeeNumerator: new Numberu64(ownerWithdrawFeeNumerator),
                ownerWithdrawFeeDenominator: new Numberu64(ownerWithdrawFeeDenominator),
                hostFeeNumerator: new Numberu64(hostFeeNumerator),
                hostFeeDenominator: new Numberu64(hostFeeDenominator),
                curveType,
                curveParameters: curveParamsBuffer,
            },
            data,
        );
        data = data.slice(0, encodeLength);
    }

    const createInitTokenSwapIX = new TransactionInstruction({
        keys,
        programId: VALHALLA_TOKEN_SWAP_PROGRAM_ID,
        data
    });

    transaction.add(createInitTokenSwapIX);

    const txSign = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, swapInfo, owner, pdaTokenAAccount, pdaTokenBAccount]
    );
    console.log("tx: ", txSign);

    const tokenSwapStateAccountData = await getTokenSwapStateAccountData(
        connection,
        swapInfo.publicKey,
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    console.log("Token Swap Account Data: ", tokenSwapStateAccountData);
}