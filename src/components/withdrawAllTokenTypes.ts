import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js"
import { getTokenSwapStateAccountData } from "../helpers/decodeAccount"
import { VALHALLA_TOKEN_SWAP_PROGRAM_ID } from "../helpers/id";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as BufferLayout from '@solana/buffer-layout';
import * as Layout from '../helpers/layout';
import { Numberu64 } from "../helpers/utils";



export const withdrawAllTokenTypes = async (
    connection: Connection,
    owner:Keypair,
    depositor: Keypair,
    tokenSwapStateAccountPubKey: PublicKey,
    // userAuthority: PublicKey,
    // userAccountA: PublicKey,
    // userAccountB: PublicKey,
    tokenA: number,
    tokenB: number,
    // poolAmountToken: number,
    // sourcePoolAccount: PublicKey,
    authority: PublicKey,
) => {
    const data = await getTokenSwapStateAccountData(
        connection,
        tokenSwapStateAccountPubKey,
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    

    const lpTokenMint = await new Token(
        connection,
        new PublicKey(data.tokenPoolMint),
        TOKEN_PROGRAM_ID,
        owner
    );
     const lpTokenMintInfo = await new Token(
        connection,
        new PublicKey(data.tokenPoolMint),
        TOKEN_PROGRAM_ID,
        owner
    ).getMintInfo();
    const lpTokenMintSupply = lpTokenMintInfo.supply.toNumber();

    const mintA = new Token(
        connection,
        new PublicKey(data.mintA),
        TOKEN_PROGRAM_ID,
        owner
    );

    const mintB = new Token(
        connection,
        new PublicKey(data.mintB),
        TOKEN_PROGRAM_ID,
        owner
    );

    const tokenSwapAAccount = await mintA.getAccountInfo(
        new PublicKey(data.tokenAccountA)
    );
    


    const tokenSwapBAccount = await mintB.getAccountInfo(
        new PublicKey(data.tokenAccountB)
    );
    const reserve0=tokenSwapAAccount.amount.toNumber();

    const reserve1=tokenSwapBAccount.amount.toNumber();


    
    const SLIPPAGE = 0;

    

    const liquidity = Math.min(
        (tokenA * (1 - SLIPPAGE) * lpTokenMintSupply) / reserve0,
        (tokenB * (1 - SLIPPAGE) * lpTokenMintSupply) / reserve1
    );
   

    // const mintA = new Token(
    //     connection,
    //     new PublicKey(data.mintA),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // );

    // const mintB = new Token(
    //     connection,
    //     new PublicKey(data.mintB),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // );

    // const lpTokenMintSupply = lpTokenMintInfo.supply.toNumber();

    //////////////change//////////
    // const tokenA = Math.floor(
    //     tokenSwapAAccount.amount.toNumber() * POOL_TOKEN_AMOUNT / lpTokenMintSupply
    // );

    // const tokenB = Math.floor(
    //     tokenSwapBAccount.amount.toNumber() * POOL_TOKEN_AMOUNT / lpTokenMintSupply
    // // );
    // const tokenA =10000;
    // const tokenB =10000;


    //console.log("userTransferAuthority",userTransferAuthority.publicKey.toString());

    // await mintA.mintTo(
    //     userAccountA,
    //     owner,
    //     [],
    //     tokenA
    // );

    // await mintA.approve(
    //     userAccountA,
    //     depo.publicKey,
    //     depo,
    //     [],
    //     tokenA
    // );


    // await mintB.mintTo(
    //     userAccountB,
    //     owner,
    //     [],
    //     tokenB
    // );
    //     console.log("1");
    // await mintB.approve(
    //     userAccountB,
    //     depo.publicKey,
    //     depo,
    //     [],
    //     tokenB
    // );

    // const newAccountPool = await lpTokenMint.createAccount(depo.publicKey);
    // console.log("newAccountPool",newAccountPool.toString());


    const depositorTokenAAccount = await connection.getTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.mintA) }
    );

    const depositorTokenBAccount = await connection.getTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.mintB) }
    );

    const depositorTokenPoolAccount = await connection.getTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.tokenPoolMint) }
    );

    const depositorTokenAAccountPubKey = depositorTokenAAccount.value[0].pubkey;
    console.log("depositorTokenAAccountPubKey",depositorTokenAAccountPubKey.toString())


    const depositorTokenBAccountPubKey = depositorTokenBAccount.value[0].pubkey;

    console.log("depositorTokenBAccountPubKey",depositorTokenBAccountPubKey.toString())

    const depositorTokenPoolAccountPubKey = depositorTokenPoolAccount.value[0].pubkey;

    console.log("depositorTokenPoolAccountPubKey",depositorTokenPoolAccountPubKey.toString())






    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64('poolTokenAmount'),
        Layout.uint64('minimumTokenA'),
        Layout.uint64('minimumTokenB'),
    ]);

    const instructionData = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 3,
            poolTokenAmount: new Numberu64(liquidity).toBuffer(),
            minimumTokenA: new Numberu64(tokenA).toBuffer(),
            minimumTokenB: new Numberu64(tokenB).toBuffer(),
        },
        instructionData,
    );

    const keys = [
        { pubkey: tokenSwapStateAccountPubKey, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: false, isWritable: false },
        { pubkey: depositor.publicKey, isSigner: true, isWritable: false },
        { pubkey: new PublicKey(data.tokenPoolMint), isSigner: false, isWritable: true },
        { pubkey: depositorTokenPoolAccountPubKey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(data.tokenAccountA), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(data.tokenAccountB), isSigner: false, isWritable: true },
        { pubkey: depositorTokenAAccountPubKey, isSigner: false, isWritable: true },
        { pubkey: depositorTokenBAccountPubKey, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(data.feeAccount), isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];



    const withdrawtIX = new TransactionInstruction({
        keys,
        programId: VALHALLA_TOKEN_SWAP_PROGRAM_ID,
        data: instructionData
    });

    let transaction = new Transaction();

    transaction.add(
        withdrawtIX
    );


    const tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [depositor]
    );

    console.log("tx: ", tx);

};