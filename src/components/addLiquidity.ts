import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction,SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js"
import { getTokenSwapStateAccountData } from "../helpers/decodeAccount"
import { VALHALLA_TOKEN_SWAP_PROGRAM_ID ,ROUTER_PROGRAM_ID} from "../helpers/id";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as BufferLayout from '@solana/buffer-layout';
import * as Layout from '../helpers/layout';
import { Numberu64 } from "../helpers/utils";
import { publicKey } from '../helpers/layout';


export const addLiquidity = async (
    connection: Connection,
    owner:Keypair,
    depositor: Keypair,
    tokenSwapStateAccountPubKey: PublicKey,
    authority: PublicKey,
    tokenA: number,
    tokenB: number,
) => {
    const data = await getTokenSwapStateAccountData(
        connection,
        tokenSwapStateAccountPubKey,
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    // const lpTokenMint = await new Token(
    //     connection,
    //     new PublicKey(data.tokenPoolMint),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // );

    // const lpTokenMint = await connection.getAccountInfo(
    //     new PublicKey(data.tokenPoolMint)
    // );

    const lpTokenMintInfo = await new Token(
        connection,
        new PublicKey(data.tokenPoolMint),
        TOKEN_PROGRAM_ID,
        owner
    ).getMintInfo();
    const lpTokenMintSupply = lpTokenMintInfo.supply.toNumber();

    // const lpTokenMintInfo = await new Token(
    //     connection,
    //     new PublicKey(data.tokenPoolMint),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // ).getMintInfo();

    // const mintA = await connection.getAccountInfo(
    //     new PublicKey(data.mintA)
    // );


    // const mintA = new Token(
    //     connection,
    //     new PublicKey(data.mintA),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // );

    // const mintB = await connection.getAccountInfo(
    //     new PublicKey(data.mintB)
    // );
    // // @ts-ignore
    // const decoded = MintLayout.decode(mintB.data)
    // console.log(Numberu64.fromBuffer(decoded.supply).toNumber());

    // const mintB = new Token(
    //     connection,
    //     new PublicKey(data.mintB),
    //     TOKEN_PROGRAM_ID,
    //     owner
    // );

    // @ts-ignore
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
  

    const depositorTokenAAccount = await connection.getParsedTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.mintA) }
    );
    console.log("userAaccount",depositorTokenAAccount.value[0].pubkey.toString())

    const depositorTokenBAccount = await connection.getParsedTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.mintB) }
    );
    console.log("userBaccount",depositorTokenBAccount.value[0].pubkey.toString())


    if (depositorTokenAAccount.value[0] == undefined && depositorTokenBAccount.value[0] == undefined) {
        console.log("User does not have any A and B Tokens");
        process.exit()
    }

    const depositorTokenAAccountPubKey = depositorTokenAAccount.value.map(account => {
        if (account.account.data.parsed.info.tokenAmount.uiAmount >= tokenA/100) {
            return account.pubkey;
        } else {
            console.log("Transaction may fail because of insufficient funds");
            return depositorTokenAAccount.value[0].pubkey
        }
    })[0];

    const depositorTokenBAccountPubKey = depositorTokenBAccount.value.map(account => {
        if (account.account.data.parsed.info.tokenAmount.uiAmount >= tokenB/100) {
            return account.pubkey;
        } else {
            console.log("Transaction may fail because of insufficient funds");
            return depositorTokenAAccount.value[0].pubkey
        }
    })[0];

    // const depositorTokenAAccountPubKey = depositorTokenAAccount.value[0].pubkey;
    // const depositorTokenBAccountPubKey = depositorTokenBAccount.value[0].pubkey;

    const userLpTokenAccount = await connection.getTokenAccountsByOwner(
        depositor.publicKey, { mint: new PublicKey(data.tokenPoolMint) }
    );


    // console.log(typeof userLpTokenAccount);

    if (userLpTokenAccount.value[0] == undefined) {

        const newAccountPoolKeypair = new Keypair();

        let transaction = new Transaction();

        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: depositor.publicKey,
                newAccountPubkey: newAccountPoolKeypair.publicKey,
                space: AccountLayout.span,
                lamports: await Token.getMinBalanceRentForExemptAccount(connection),
                programId: TOKEN_PROGRAM_ID
            }),

            Token.createInitAccountInstruction(
                TOKEN_PROGRAM_ID,
                new PublicKey(data.tokenPoolMint),
                newAccountPoolKeypair.publicKey,
                depositor.publicKey
            )
        );

        const dataLayout = BufferLayout.struct([
            BufferLayout.u8('instruction'),
            Layout.uint64('maximumTokenA'),
            Layout.uint64('maximumTokenB'),
            Layout.uint64('poolTokenamount'),

        ]);

        const instructionData = Buffer.alloc(dataLayout.span);
        dataLayout.encode(
            {
                instruction: 0,
                maximumTokenA: new Numberu64(tokenA).toBuffer(),
                maximumTokenB: new Numberu64(tokenB).toBuffer(),
                poolTokenamount: new Numberu64(liquidity).toBuffer(),

            },
            instructionData,
        );

        const keys = [
            { pubkey: depositor.publicKey, isSigner: true, isWritable: false },
            { pubkey: depositorTokenAAccountPubKey, isSigner: false, isWritable: true },

            { pubkey: depositorTokenBAccountPubKey, isSigner: false, isWritable: true },
            { pubkey: newAccountPoolKeypair.publicKey, isSigner: false, isWritable: true },

            { pubkey: VALHALLA_TOKEN_SWAP_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(data.tokenAccountA), isSigner: false, isWritable: true },
            
            { pubkey: new PublicKey(data.tokenAccountB), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(data.tokenPoolMint), isSigner: false, isWritable: true },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },

            { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },

            { pubkey: tokenSwapStateAccountPubKey, isSigner: false, isWritable: false },
            { pubkey: authority, isSigner: false, isWritable: false },
            
        ];

        const depositIX = new TransactionInstruction({
            keys,
            programId: ROUTER_PROGRAM_ID,
            data: instructionData
        });

        transaction.add(
            depositIX
        );


        const tx = await sendAndConfirmTransaction(
            connection,
            transaction,
            [depositor, newAccountPoolKeypair]
        );

        console.log("tx: ", tx);
    } else {

        let transaction = new Transaction();

        const dataLayout = BufferLayout.struct([
            BufferLayout.u8('instruction'),
            Layout.uint64('maximumTokenA'),
            Layout.uint64('maximumTokenB'),
            Layout.uint64('poolTokenamount'),

        ]);

        const instructionData = Buffer.alloc(dataLayout.span);
        dataLayout.encode(
            {
                instruction: 1,
                maximumTokenA: new Numberu64(tokenA).toBuffer(),
                maximumTokenB: new Numberu64(tokenB).toBuffer(),
                poolTokenamount: new Numberu64(liquidity).toBuffer(),

            },
            instructionData,
        );

        const keys = [

            { pubkey: depositor.publicKey, isSigner: true, isWritable: false },
            { pubkey: depositorTokenAAccountPubKey, isSigner: false, isWritable: true },
            { pubkey: depositorTokenBAccountPubKey, isSigner: false, isWritable: true },
            { pubkey: userLpTokenAccount.value[0].pubkey, isSigner: false, isWritable: true },
            { pubkey: VALHALLA_TOKEN_SWAP_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(data.tokenAccountA), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(data.tokenAccountB), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(data.tokenPoolMint), isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },

            { pubkey: tokenSwapStateAccountPubKey, isSigner: false, isWritable: false }, 
            { pubkey: authority, isSigner: false, isWritable: false },
            
         
            
        ];

        const depositIX = new TransactionInstruction({
            keys,
            programId: ROUTER_PROGRAM_ID,
            data: instructionData
        });

        transaction.add(
            depositIX
        );


        const tx = await sendAndConfirmTransaction(
            connection,
            transaction,
            [depositor]
        );

        console.log("tx: ", tx);
    }

    // const dataLayout = BufferLayout.struct([
    //     BufferLayout.u8('instruction'),
    //     Layout.uint64('poolTokenAmount'),
    //     Layout.uint64('maximumTokenA'),
    //     Layout.uint64('maximumTokenB'),
    // ]);

    // const instructionData = Buffer.alloc(dataLayout.span);
    // dataLayout.encode(
    //     {
    //         instruction: 2,
    //         poolTokenAmount: new Numberu64(POOL_TOKEN_AMOUNT).toBuffer(),
    //         maximumTokenA: new Numberu64(tokenAAmount).toBuffer(),
    //         maximumTokenB: new Numberu64(tokenBAmount).toBuffer(),
    //     },
    //     instructionData,
    // );

    // const keys = [
    //     { pubkey: tokenSwapStateAccountPubKey, isSigner: false, isWritable: false },
    //     { pubkey: authority, isSigner: false, isWritable: false },
    //     { pubkey: depositor.publicKey, isSigner: true, isWritable: false },
    //     { pubkey: depositorTokenAAccountPubKey, isSigner: false, isWritable: true },
    //     { pubkey: depositorTokenBAccountPubKey, isSigner: false, isWritable: true },
    //     { pubkey: new PublicKey(data.tokenAccountA), isSigner: false, isWritable: true },
    //     { pubkey: new PublicKey(data.tokenAccountB), isSigner: false, isWritable: true },
    //     { pubkey: new PublicKey(data.tokenPoolMint), isSigner: false, isWritable: true },
    //     { pubkey: newAccountPoolKeypair.publicKey, isSigner: false, isWritable: true },
    //     { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // ];

    // const depositIX = new TransactionInstruction({
    //     keys,
    //     programId: VALHALLA_TOKEN_SWAP_PROGRAM_ID,
    //     data: instructionData
    // });

    // transaction.add(
    //     depositIX
    // );


    // const tx = await sendAndConfirmTransaction(
    //     connection,
    //     transaction,
    //     [depositor, newAccountPoolKeypair]
    // );

    // console.log("tx: ", tx);

};