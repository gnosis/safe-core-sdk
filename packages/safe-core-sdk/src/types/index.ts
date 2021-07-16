interface AbiInput {
  name: string
  type: string
  indexed?: boolean
  components?: AbiInput[]
  internalType?: string
}

interface AbiOutput {
  name: string
  type: string
  components?: AbiOutput[]
  internalType?: string
}

export interface AbiItem {
  anonymous?: boolean
  constant?: boolean
  inputs?: AbiInput[]
  name?: string
  outputs?: AbiOutput[]
  payable?: boolean
  stateMutability: string
  type: string
  gas?: number
}
