import { AddressZero } from '@ethersproject/constants'
import { deployments, ethers } from 'hardhat'
import {
  DailyLimitModule,
  ERC20Mintable,
  GnosisSafe,
  MultiSend,
  SocialRecoveryModule
} from '../../src/types/typechain/ethers-v5'

export const getSafeSingleton = async () => {
  const SafeDeployment = await deployments.get('GnosisSafe')
  const Safe = await ethers.getContractFactory('GnosisSafe')
  return Safe.attach(SafeDeployment.address)
}

export const getFactory = async () => {
  const FactoryDeployment = await deployments.get('GnosisSafeProxyFactory')
  const Factory = await ethers.getContractFactory('GnosisSafeProxyFactory')
  return Factory.attach(FactoryDeployment.address)
}

export const getSafeTemplate = async (): Promise<GnosisSafe> => {
  const singleton = await getSafeSingleton()
  const factory = await getFactory()
  const template = await factory.callStatic.createProxy(singleton.address, '0x')
  await factory.createProxy(singleton.address, '0x').then((tx: any) => tx.wait())
  const Safe = await ethers.getContractFactory('GnosisSafe')
  return Safe.attach(template) as GnosisSafe
}

export const getSafeWithOwners = async (
  owners: string[],
  threshold?: number
): Promise<GnosisSafe> => {
  const template = await getSafeTemplate()
  await template.setup(
    owners,
    threshold || owners.length,
    AddressZero,
    '0x',
    AddressZero,
    AddressZero,
    0,
    AddressZero
  )
  return template
}

export const getMultiSend = async (): Promise<MultiSend> => {
  const MultiSendDeployment = await deployments.get('MultiSend')
  const MultiSend = await ethers.getContractFactory('MultiSend')
  return MultiSend.attach(MultiSendDeployment.address) as MultiSend
}

export const getDailyLimitModule = async (): Promise<DailyLimitModule> => {
  const DailyLimitModuleDeployment = await deployments.get('DailyLimitModule')
  const DailyLimitModule = await ethers.getContractFactory('DailyLimitModule')
  return DailyLimitModule.attach(DailyLimitModuleDeployment.address) as DailyLimitModule
}

export const getSocialRecoveryModule = async (): Promise<SocialRecoveryModule> => {
  const SocialRecoveryModuleDeployment = await deployments.get('SocialRecoveryModule')
  const SocialRecoveryModule = await ethers.getContractFactory('SocialRecoveryModule')
  return SocialRecoveryModule.attach(SocialRecoveryModuleDeployment.address) as SocialRecoveryModule
}

export const getERC20Mintable = async (): Promise<ERC20Mintable> => {
  const ERC20MintableDeployment = await deployments.get('ERC20Mintable')
  const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
  return ERC20Mintable.attach(ERC20MintableDeployment.address) as ERC20Mintable
}
