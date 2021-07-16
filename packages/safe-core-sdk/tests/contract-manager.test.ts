import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe, { ContractNetworksConfig } from '../src'
import { ZERO_ADDRESS } from '../src/utils/constants'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'

chai.use(chaiAsPromised)

describe('Safe contracts manager', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks,
      chainId
    }
  })

  describe('create', async () => {
    it('should fail if the current network is not a default network and no contractNetworks is provided', async () => {
      const { safe, accounts } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      await chai
        .expect(
          Safe.create({
            ethAdapter,
            safeAddress: safe.address
          })
        )
        .to.be.rejectedWith('Safe contracts not found in the current network')
    })

    it('should fail if Safe Proxy contract is not deployed in the current network', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      await chai
        .expect(
          Safe.create({
            ethAdapter,
            safeAddress: ZERO_ADDRESS,
            contractNetworks
          })
        )
        .to.be.rejectedWith('Safe Proxy contract is not deployed in the current network')
    })

    it('should fail if MultiSend contract is specified in contractNetworks but not deployed', async () => {
      const { safe, accounts, chainId } = await setupTests()
      const contractNetworks: ContractNetworksConfig = {
        [chainId]: { multiSendAddress: ZERO_ADDRESS }
      }
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      await chai
        .expect(
          Safe.create({
            ethAdapter,
            safeAddress: safe.address,
            contractNetworks
          })
        )
        .to.be.rejectedWith('MultiSend contract is not deployed in the current network')
    })

    it('should set the MultiSend contract available in the current network', async () => {
      const { safe, accounts, chainId, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai
        .expect(safeSdk.getMultiSendAddress())
        .to.be.eq(contractNetworks[chainId].multiSendAddress)
    })
  })
})
