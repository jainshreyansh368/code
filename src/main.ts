import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { initTokenSwap } from "./components/initTokenSwap";
import { getConnection } from "./helpers/connection";
import { getPayer, getOwner, getdepo, getuser } from './helpers/entities';
import {
    VALHALLA_TOKEN_SWAP_PROGRAM_ID,
    TOKEN_A_MINT,
    TOKEN_B_MINT,
    TOKEN_A_ACCOUNT,
    TOKEN_B_ACCOUNT,
    Pool_Id,
    progID,
    user1

} from "./helpers/id";
import { Numberu64, CurveType } from "./helpers/utils";
import { depositAllTokenTypes } from "./components/depositAllTokenTypes";
import { withdrawAllTokenTypes } from "./components/withdrawAllTokenTypes";
import { swap } from "./components/swap";
import { addLiquidity } from "./components/addLiquidity";
import { Router_swap } from "./components/RouterSwap";
import { RouterwithdrawAllTokenTypes } from "./components/RouterWithdraw";
import { createWrappedNativeAccount} from "./components/wrap";
// import { programID } from './helpers/id';
import{raydium_stake}from "./components/raydiumState"

createWrappedNativeAccount
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = 0;
const OWNER_WITHDRAW_FEE_DENOMINATOR = 0;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;

const initSwapIns = async () => {
    const connection: Connection = await getConnection();
    const ownerAndPayer: Keypair = await getOwner();
    // const owner: Keypair = await getOwner();
    const swapInfo: Keypair = new Keypair();

    const pda = await PublicKey.findProgramAddress(
        [swapInfo.publicKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    const ownerTokenAAccounts = await connection.getParsedTokenAccountsByOwner(
        ownerAndPayer.publicKey,
        { mint: TOKEN_A_MINT }
    );

    await initTokenSwap(
        connection,
        ownerAndPayer,
        ownerAndPayer,
        swapInfo,
        TRADING_FEE_NUMERATOR,
        TRADING_FEE_DENOMINATOR,
        OWNER_TRADING_FEE_NUMERATOR,
        OWNER_TRADING_FEE_DENOMINATOR,
        OWNER_WITHDRAW_FEE_NUMERATOR,
        OWNER_WITHDRAW_FEE_DENOMINATOR,
        HOST_FEE_NUMERATOR,
        HOST_FEE_DENOMINATOR,
        pda[0],
        TOKEN_A_ACCOUNT,
        TOKEN_B_ACCOUNT,
        CurveType.ConstantPrice,
        new Numberu64(11)
    )
}

const depositAllTokenTypesIns = async (
    tokenSwapAccount: string,
    maxAToken: string,
    maxBToken: string
) => {
    const connection: Connection = await getConnection();
    const depositor: Keypair = await getdepo();
    const owner=await getOwner();

    const tokenAAmount = Number(maxAToken)*100;
    const tokenBAmount = Number(maxBToken)*100;

    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await depositAllTokenTypes(
        connection,
        owner,
        depositor,
        tokenSwapStateAccountPubKey,
        pda[0],
        tokenAAmount,
        tokenBAmount
    );
};

const withdrawAllTokenTypesIns = async (
    tokenSwapAccount: string,
    minAToken: string,
    minBToken: string
) => {
  
    const connection: Connection = await getConnection();
    const depositor: Keypair = await getdepo();
    const owner: Keypair = await getOwner();


    const minATokenAmount = Number(minAToken);
    const minBTokenAmount = Number(minBToken);

    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await withdrawAllTokenTypes(
        connection,
        owner,
        depositor,
        tokenSwapStateAccountPubKey,
        minATokenAmount,
        minBTokenAmount,
        pda[0]
    );
}



////////////////////////////////////////////////////////////
const swapInstruction = async (
    tokenSwapAccount: string,
    amountIn: string,
    minAmountOut: string
) => {
  
    const connection: Connection = await getConnection();
    const owner: Keypair = await getOwner();
    const user: Keypair = await getuser();


    const SLIPPAGE=0;
    const amount_In = Number(amountIn)*100;
    const minAmount_Out = (Number(minAmountOut) * (1 - SLIPPAGE))*100;

    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);
    console.log("tokenSwapStateAccountPubKey",tokenSwapStateAccountPubKey.toString())

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await swap(
        connection,
        owner,
        user,
        tokenSwapStateAccountPubKey,
        amount_In,
        minAmount_Out,
        pda[0]
    );
}

///////////////////////////////////////////////////////////////////////////////////////
///////////////ROUTERS INSTRUCTION/////////////////////////////////////////


const addLiquidityIns = async (
    tokenSwapAccount: string,
    maxAToken: string,
    maxBToken: string,
) => {
    console.log("entry")
    const connection: Connection = await getConnection();
    const depositor: Keypair = await getdepo();
    const owner=await getOwner();

    const tokenAAmount = Number(maxAToken)*100;
    console.log("tokenAAmount",tokenAAmount);
    const tokenBAmount = Number(maxBToken)*100;


    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await addLiquidity(
        connection,
        owner,
        depositor,
        tokenSwapStateAccountPubKey,
        pda[0],
        tokenAAmount,
        tokenBAmount,
        
    );
};

const RouterswapInstruction = async (
    tokenSwapAccount: string,
    amountAIn: string,
    amountBIn: string,
    minAmountOut: string
) => {
  
    const connection: Connection = await getConnection();
    const owner: Keypair = await getOwner();
    const user: Keypair = await getuser();


    const SLIPPAGE=0;
    const amount_A_In = Number(amountAIn)*1000000000;
    const amount_B_In = Number(amountBIn)*100;

    const minAmount_Out = (Number(minAmountOut) * (1 - SLIPPAGE))*100;

    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);
    console.log("tokenSwapStateAccountPubKey",tokenSwapStateAccountPubKey.toString())

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await Router_swap(
        connection,
        owner,
        user,
        tokenSwapStateAccountPubKey,
        amount_A_In,
        amount_B_In,
        minAmount_Out,
        pda[0]
    );
}


const RouterwithdrawAllTokenTypesIns = async (
    tokenSwapAccount: string,
    minAToken: string,
    minBToken: string
) => {
  
    const connection: Connection = await getConnection();
    const depositor: Keypair = await getdepo();
    const owner: Keypair = await getOwner();


    const minATokenAmount = Number(minAToken)*100;
    const minBTokenAmount = Number(minBToken)*100;

    const tokenSwapStateAccountPubKey = new PublicKey(tokenSwapAccount);

    const pda = await await PublicKey.findProgramAddress(
        [tokenSwapStateAccountPubKey.toBuffer()],
        VALHALLA_TOKEN_SWAP_PROGRAM_ID
    );

    await RouterwithdrawAllTokenTypes(
        connection,
        owner,
        depositor,
        tokenSwapStateAccountPubKey,
        minATokenAmount,
        minBTokenAmount,
        pda[0]
    );
}




////////////////////////////END////////////////////////////////////////////////////////////////


const wrapIn = async (
    amount: string,
  
) => {
  
    const connection: Connection = await getConnection();
   
    const owner: Keypair = await getOwner();


    const Amount = Number(amount)*1000000000;
    

    await createWrappedNativeAccount(
        connection,
        owner,
        Amount,
    );
}

// ////////////////////////////////////////////////////////////////
// const createStateACC = async (
//     amount: string,
  
// ) => {
  
//     const connection: Connection = await getConnection();
   
//     const owner: Keypair = await getOwner();


//     const Amount = Number(amount)*1000000000;
    

//     await raydium_stake(
//         connection,
//         Pool_Id,
//         owner,
//         progID,
//     );
// }








if (process.argv[2] == "0") {
    console.log("Instruction: Initializing Token Swap");
    initSwapIns().then(() => process.exit);
} else if (process.argv[2] == "1") {
    console.log("Instruction: Deposit All Token Types")
    depositAllTokenTypesIns(
        process.argv[3],
        process.argv[4],
        process.argv[5]
    ).then(() => process.exit());
} else if (process.argv[2] == "2") {
    console.log("Instruction: Withdraw All Token Types")
    withdrawAllTokenTypesIns(
        process.argv[3],
        process.argv[4],
        process.argv[5]
    ).then(() => process.exit());
} else if (process.argv[2] == "3") {
    console.log("Instruction: swapping")
    swapInstruction(
        process.argv[3],
        process.argv[4],
        process.argv[5]
    ).then(() => process.exit());
} else if (process.argv[2]=="4"){
    console.log("Router Instruction:Add liquidity")
    addLiquidityIns(
        process.argv[3],
        process.argv[4],
        process.argv[5],



    )

}  else if (process.argv[2]=="5"){
    console.log("Router Instruction:Swapping")
    RouterswapInstruction(
        process.argv[3],
        process.argv[4],
        process.argv[5],
        process.argv[5],

    )

}   else if (process.argv[2]=="6"){
    console.log("Router Instruction:withdarw")
    RouterwithdrawAllTokenTypesIns(
        process.argv[3],
        process.argv[4],
        process.argv[5],
     

        
    )
}   else if (process.argv[2]=="7"){
    console.log("WrapSoleCon")
    wrapIn(
        process.argv[3],
  
    )
}
    else {
    console.log("error");
}