import algosdk from 'algosdk'
import type { Algodv2 } from 'algosdk'
import { signTxnsWithPera } from './pera'

export async function signAndSendPayment(
  algod: Algodv2,
  sender: string,
  recipient: string,
  amountAlgo: number
): Promise<string> {
  const sp = await algod.getTransactionParams().do()
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender,
    to: recipient,
    amount: Math.round(amountAlgo * 1_000_000),
    suggestedParams: sp,
  })
  const signed = await signTxnsWithPera([txn.toByte()])
  const { txId } = await algod.sendRawTransaction(signed[0]).do() as { txId: string }
  return txId
}