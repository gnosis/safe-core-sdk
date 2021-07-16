import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import EthAdapter from '../ethereumLibs/EthAdapter'
import { isRestrictedAddress, sameString } from '../utils'
import { SENTINEL_ADDRESS } from '../utils/constants'

class OwnerManager {
  #ethAdapter: EthAdapter
  #safeContract: GnosisSafeContract

  constructor(ethAdapter: EthAdapter, safeContract: GnosisSafeContract) {
    this.#ethAdapter = ethAdapter
    this.#safeContract = safeContract
  }

  private validateOwnerAddress(ownerAddress: string, errorMessage?: string): void {
    const isValidAddress = this.#ethAdapter.isAddress(ownerAddress)
    if (!isValidAddress || isRestrictedAddress(ownerAddress)) {
      throw new Error(errorMessage || 'Invalid owner address provided')
    }
  }

  private validateThreshold(threshold: number, numOwners: number): void {
    if (threshold <= 0) {
      throw new Error('Threshold needs to be greater than 0')
    }
    if (threshold > numOwners) {
      throw new Error('Threshold cannot exceed owner count')
    }
  }

  private validateAddressIsNotOwner(
    ownerAddress: string,
    owners: string[],
    errorMessage?: string
  ): void {
    const ownerIndex = owners.findIndex((owner: string) => sameString(owner, ownerAddress))
    const isOwner = ownerIndex >= 0
    if (isOwner) {
      throw new Error(errorMessage || 'Address provided is already an owner')
    }
  }

  private validateAddressIsOwner(
    ownerAddress: string,
    owners: string[],
    errorMessage?: string
  ): number {
    const ownerIndex = owners.findIndex((owner: string) => sameString(owner, ownerAddress))
    const isOwner = ownerIndex >= 0
    if (!isOwner) {
      throw new Error(errorMessage || 'Address provided is not an owner')
    }
    return ownerIndex
  }

  async getOwners(): Promise<string[]> {
    const owners = await this.#safeContract.getOwners()
    return [...owners]
  }

  async getThreshold(): Promise<number> {
    return this.#safeContract.getThreshold()
  }

  async isOwner(ownerAddress: string): Promise<boolean> {
    return this.#safeContract.isOwner(ownerAddress)
  }

  async encodeAddOwnerWithThresholdData(ownerAddress: string, threshold?: number): Promise<string> {
    this.validateOwnerAddress(ownerAddress)
    const owners = await this.getOwners()
    this.validateAddressIsNotOwner(ownerAddress, owners)
    const newThreshold = threshold ?? (await this.getThreshold())
    this.validateThreshold(newThreshold, owners.length)
    return this.#safeContract.encode('addOwnerWithThreshold', [ownerAddress, newThreshold])
  }

  async encodeRemoveOwnerData(ownerAddress: string, threshold?: number): Promise<string> {
    this.validateOwnerAddress(ownerAddress)
    const owners = await this.getOwners()
    const ownerIndex = this.validateAddressIsOwner(ownerAddress, owners)
    const newThreshold = threshold ?? (await this.getThreshold()) - 1
    this.validateThreshold(newThreshold, owners.length - 1)
    const prevOwnerAddress = ownerIndex === 0 ? SENTINEL_ADDRESS : owners[ownerIndex - 1]
    return this.#safeContract.encode('removeOwner', [prevOwnerAddress, ownerAddress, newThreshold])
  }

  async encodeSwapOwnerData(oldOwnerAddress: string, newOwnerAddress: string): Promise<string> {
    this.validateOwnerAddress(newOwnerAddress, 'Invalid new owner address provided')
    this.validateOwnerAddress(oldOwnerAddress, 'Invalid old owner address provided')
    const owners = await this.getOwners()
    this.validateAddressIsNotOwner(
      newOwnerAddress,
      owners,
      'New address provided is already an owner'
    )
    const oldOwnerIndex = this.validateAddressIsOwner(
      oldOwnerAddress,
      owners,
      'Old address provided is not an owner'
    )
    const prevOwnerAddress = oldOwnerIndex === 0 ? SENTINEL_ADDRESS : owners[oldOwnerIndex - 1]
    return this.#safeContract.encode('swapOwner', [
      prevOwnerAddress,
      oldOwnerAddress,
      newOwnerAddress
    ])
  }

  async encodeChangeThresholdData(threshold: number): Promise<string> {
    const owners = await this.getOwners()
    this.validateThreshold(threshold, owners.length)
    return this.#safeContract.encode('changeThreshold', [threshold])
  }
}

export default OwnerManager
