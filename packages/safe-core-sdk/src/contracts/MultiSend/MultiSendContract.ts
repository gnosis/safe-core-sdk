interface MultiSendContract {
  getAddress(): string
  encode(methodName: any, params: any): string
}

export default MultiSendContract
