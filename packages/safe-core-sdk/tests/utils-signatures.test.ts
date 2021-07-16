import chai from 'chai'
import { adjustVInSignature, isTxHashSignedWithPrefix } from '../src/utils/signatures'

describe('Signature utils', () => {
  describe('isTxHashSignedWithPrefix', () => {
    it('returns false if message was signed without a prefix', () => {
      const safeTxHash = '0x4de27e660bd23052b71c854b0188ef1c5b325b10075c70f27afe2343e5c287f5'
      const ownerAddress = '0xbc2BB26a6d821e69A38016f3858561a1D80d4182'
      const signature =
        '0x12f8d73b47a0a664294caac0bd6ccf03a0d1d3d1943bdd138a9757f993cb4f7c432f029873af8ad898d3f83a8a42f765628f36d39a01c90708ce5bd6d77a269d1b'
      chai.expect(isTxHashSignedWithPrefix(safeTxHash, signature, ownerAddress)).to.be.false
    })

    it('returns true if message was signed with a prefix', () => {
      const safeTxHash = '0x4de27e660bd23052b71c854b0188ef1c5b325b10075c70f27afe2343e5c287f5'
      const ownerAddress = '0xa088642a83BF49189d5160e2632392949Bb4296D'
      const signature =
        '0x4d44abdcc39e259238870493c29d26fbe14b0564afe2b25326311ddc397cff8d4014e09a2a296efb2dc0231c622289e015d0cbd469ae67d509675e6112bd0b061b'
      chai.expect(isTxHashSignedWithPrefix(safeTxHash, signature, ownerAddress)).to.be.true
    })
  })

  describe('adjustVInSignature', () => {
    it('eth_sign: adjusts V to V > 30 when message is signed with a prefix', () => {
      const hex27 = '1b'
      const hex31 = '1f'
      const signature = `0x4d44abdcc39e259238870493c29d26fbe14b0564afe2b25326311ddc397cff8d4014e09a2a296efb2dc0231c622289e015d0cbd469ae67d509675e6112bd0b06${hex27}`
      const adjustedSignature = `0x4d44abdcc39e259238870493c29d26fbe14b0564afe2b25326311ddc397cff8d4014e09a2a296efb2dc0231c622289e015d0cbd469ae67d509675e6112bd0b06${hex31}`
      chai.expect(adjustVInSignature(signature, true)).to.be.eq(adjustedSignature)
    })

    it('eth_sign: adjusts V to V > 30 when message is signed with a prefix and V < 27', () => {
      const hex01 = '01'
      const hex32 = '20'
      const signature = `0x4d44abdcc39e259238870493c29d26fbe14b0564afe2b25326311ddc397cff8d4014e09a2a296efb2dc0231c622289e015d0cbd469ae67d509675e6112bd0b06${hex01}`
      const adjustedSignature = `0x4d44abdcc39e259238870493c29d26fbe14b0564afe2b25326311ddc397cff8d4014e09a2a296efb2dc0231c622289e015d0cbd469ae67d509675e6112bd0b06${hex32}`
      chai.expect(adjustVInSignature(signature, true)).to.be.eq(adjustedSignature)
    })

    it("eth_sign: doesn't touch V when message is signed without a prefix and V is one of {27, 28}", () => {
      const hex27 = '1b'
      const signature = `0x12f8d73b47a0a664294caac0bd6ccf03a0d1d3d1943bdd138a9757f993cb4f7c432f029873af8ad898d3f83a8a42f765628f36d39a01c90708ce5bd6d77a269d${hex27}`
      chai.expect(adjustVInSignature(signature, false)).to.be.eq(signature)
    })
  })
})
