import { SafeEthersSigner, SafeService } from '../src'
import dotenv from 'dotenv'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import EthersSafe from '@gnosis.pm/safe-core-sdk'
import { ethers } from 'ethers'

dotenv.config()

const sample = async () => {
    console.log("Setup provider")
    const provider = new JsonRpcProvider(process.env.JSON_RPC!!)
    console.log("Setup SafeServices")
    const service = new SafeService(process.env.SERVICE_URL!!)
    console.log("Setup Signer")
    const signer = new Wallet(process.env.SIGNER_KEY!!, provider)
    console.log("Setup SafeEthersSigner")
    const safe = await EthersSafe.create({ ethers, safeAddress: process.env.DEPLOYER_SAFE!!, providerOrSigner: signer })
    const safeSigner = new SafeEthersSigner(safe, service, provider)
    const contract = new Contract("0xe50c6391a6cb10f9B9Ef599aa1C68C82dD88Bd91", ["function pin(string newMessage)"], safeSigner)
    const proposedTx = await contract.functions.pin(`Local time: ${new Date().toLocaleString()}`)
    console.log("USER ACTION REQUIRED")
    console.log("Go to the Gnosis Safe Web App to confirm the transcation")
    console.log(await proposedTx.wait())
    console.log("Transaction has been executed")
}

sample()