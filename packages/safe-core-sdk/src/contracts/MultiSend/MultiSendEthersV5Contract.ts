import { MultiSend, MultiSendInterface } from '../../types/typechain/ethers-v5/MultiSend'
import MultiSendContract from './MultiSendContract'

class MultiSendEthersV5Contract implements MultiSendContract {
  constructor(public contract: MultiSend) {}

  getAddress(): string {
    return this.contract.address
  }

  encode: MultiSendInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }
}

export default MultiSendEthersV5Contract
