import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js"
import { getTokenSwapStateAccountData } from "../helpers/decodeAccount"
import { VALHALLA_TOKEN_SWAP_PROGRAM_ID } from "../helpers/id";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as BufferLayout from '@solana/buffer-layout';
import * as Layout from '../helpers/layout';
import { Numberu64 } from "../helpers/utils";



export const swap = async (
    connection: Connection,
    owner:Keypair,
    user: Keypair,
    tokenSwapStateAccountPubKey: PublicKey,
    AmountIN: number,
    MinAmountOut: number,
    authority: PublicKey,
) => {
    const data = await getTokenSwapStateAccountData(
        connection,
        tokenSwapStateAccountPubKey,
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    const userTokenAAccount = await connection.getTokenAccountsByOwner(
        user.publicKey, { mint: new PublicKey(data.mintA) }
    );

    const userTokenBAccount = await connection.getTokenAccountsByOwner(
        user.publicKey, { mint: new PublicKey(data.mintB) }
    );

    const userTokenPoolAccount = await connection.getTokenAccountsByOwner(
        user.publicKey, { mint: new PublicKey(data.tokenPoolMint) }
    );

    const userTokenAAccountPubKey = userTokenAAccount.value[0].pubkey;
    console.log("userTokenAAccountPubKey",userTokenAAccountPubKey.toString())


    const userTokenBAccountPubKey = userTokenBAccount.value[0].pubkey;

    console.log("userTokenBAccountPubKey",userTokenBAccountPubKey.toString())



    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64('amountIn'),
        Layout.uint64('minimumAmountOut'),
    ]);

    const instructionData = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 1,
            amountIn: new Numberu64(AmountIN).toBuffer(),
            minimumAmountOut: new Numberu64(MinAmountOut).toBuffer(),
        },
        instructionData,
    );
    const keys = [
        { pubkey: tokenSwapStateAccountPubKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: user.publicKey, isSigner: true, isWritable: false },

        { pubkey: userTokenAAccountPubKey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(data.tokenAccountA), isSigner: false, isWritable: true },

        { pubkey: new PublicKey(data.tokenAccountB), isSigner: false, isWritable: true },
        { pubkey: userTokenBAccountPubKey, isSigner: false, isWritable: true },


        { pubkey: new PublicKey(data.tokenPoolMint), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(data.feeAccount), isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];


    const swapix = new TransactionInstruction({
        keys,
        programId: VALHALLA_TOKEN_SWAP_PROGRAM_ID,
        data: instructionData
    });

    let transaction = new Transaction();

    transaction.add(
        swapix
    );


    const tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user]
    );
    
    console.log("tx: ", tx);

};