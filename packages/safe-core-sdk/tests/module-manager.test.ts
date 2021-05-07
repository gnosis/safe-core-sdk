import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import { deployments, waffle } from 'hardhat'
import EthersSafe from '../src'
import { ContractNetworksConfig } from '../src/configuration/contracts'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '../src/utils/constants'
import { DailyLimitModule, GnosisSafe, SocialRecoveryModule } from '../typechain'
import {
  getDailyLimitModule,
  getMultiSend,
  getSafeWithOwners,
  getSocialRecoveryModule
} from './utils/setup'
chai.use(chaiAsPromised)

interface SetupTestsResult {
  safe: GnosisSafe
  contractNetworks: ContractNetworksConfig
  dailyLimitModule: DailyLimitModule
  socialRecoveryModule: SocialRecoveryModule
}

describe('Safe modules Manager', () => {
  const [user1] = waffle.provider.getWallets()

  const setupTests = deployments.createFixture(
    async ({ deployments }): Promise<SetupTestsResult> => {
      await deployments.fixture()
      const safe: GnosisSafe = await getSafeWithOwners([user1.address])
      const chainId: number = (await waffle.provider.getNetwork()).chainId
      const dailyLimitModule: DailyLimitModule = await getDailyLimitModule()
      const socialRecoveryModule: SocialRecoveryModule = await getSocialRecoveryModule()
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: (await getMultiSend()).address }
      }
      return { safe, contractNetworks, dailyLimitModule, socialRecoveryModule }
    }
  )

  describe('getModules', async () => {
    it('should return all the enabled modules', async () => {
      const { safe, dailyLimitModule, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      const tx = await safeSdk.getEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
    })
  })

  describe('isModuleEnabled', async () => {
    it('should return true if a module is enabled', async () => {
      const { safe, dailyLimitModule, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      const tx = await safeSdk.getEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
    })
  })

  describe('getEnableModuleTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getEnableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getEnableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getEnableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is already enabled', async () => {
      const { safe, dailyLimitModule, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx1 = await safeSdk.getEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx1)
      await txResponse.wait()
      const tx2 = safeSdk.getEnableModuleTx(dailyLimitModule.address)
      await chai.expect(tx2).to.be.rejectedWith('Module provided is already enabled')
    })

    it('should enable a Safe module', async () => {
      const { safe, dailyLimitModule, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      const tx = await safeSdk.getEnableModuleTx(dailyLimitModule.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await txResponse.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
    })
  })

  describe('getDisableModuleTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getDisableModuleTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getDisableModuleTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getDisableModuleTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid module address provided')
    })

    it('should fail if address is not enabled', async () => {
      const { safe, dailyLimitModule, contractNetworks } = await setupTests()
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })
      const tx = safeSdk.getDisableModuleTx(dailyLimitModule.address)
      await chai.expect(tx).to.be.rejectedWith('Module provided is not enabled already')
    })

    it('should disable Safe modules', async () => {
      const { dailyLimitModule, socialRecoveryModule, contractNetworks } = await setupTests()
      const safe = await getSafeWithOwners([user1.address])
      const safeSdk = await EthersSafe.create({
        ethers,
        safeAddress: safe.address,
        providerOrSigner: user1,
        contractNetworks
      })

      const tx1 = await safeSdk.getEnableModuleTx(dailyLimitModule.address)
      const txResponse1 = await safeSdk.executeTransaction(tx1)
      await txResponse1.wait()
      const tx2 = await safeSdk.getEnableModuleTx(socialRecoveryModule.address)
      const txResponse2 = await safeSdk.executeTransaction(tx2)
      await txResponse2.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(2)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.true
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.true

      const tx3 = await safeSdk.getDisableModuleTx(dailyLimitModule.address)
      const txResponse3 = await safeSdk.executeTransaction(tx3)
      await txResponse3.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(1)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.true

      const tx4 = await safeSdk.getDisableModuleTx(socialRecoveryModule.address)
      const txResponse4 = await safeSdk.executeTransaction(tx4)
      await txResponse4.wait()
      chai.expect((await safeSdk.getModules()).length).to.be.eq(0)
      chai.expect(await safeSdk.isModuleEnabled(dailyLimitModule.address)).to.be.false
      chai.expect(await safeSdk.isModuleEnabled(socialRecoveryModule.address)).to.be.false
    })
  })
})