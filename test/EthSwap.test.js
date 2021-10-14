const { assert } = require('chai');
const { default: Web3 } = require('web3')

const Token = artifacts.require('SMTKToken')
const BnbSwap = artifacts.require('BnbSwap')

const BN = require('BN.js');

require('chai')
.use(require('chai-as-promised'))
.should()

function tokens(n){
    return web3.utils.toWei(n,'ether');
}

contract ('BnbSwap', ([deployer, investor]) => {
    let bnbSwap, token, bnbSwapBalanceAfter, tokensBought, result, totalSupply;

    before(async () => {

        token = await Token.new();
        bnbSwap = await BnbSwap.new(token.address,'212121');
        totalSupply = await token.totalSupply()
        await token.transfer(bnbSwap.address, (new BN(totalSupply, 10)).div(new BN(10, 10)));

    })

    describe('Token deployement', async => {
        it('contract has a name', async () => {
            const name = await token.name();
            assert.equal(name, 'Smart Token')
            
        })
    })

    describe('BnbSwap deployement', async => {
        it('contract has a name', async () => {
            const name = await bnbSwap.name();
            assert.equal(name, 'BnbSwap Instant Exchange');
        })
        it('bnbSwap has tokens', async () => {            
            let balance = await token.balanceOf(bnbSwap.address);
            assert.equal(balance.toString(), (new BN(totalSupply, 10)).div(new BN(10, 10)));
         })
        })

    describe('buyTokens()', async => {
        before(async () => {
            // Purchase tokens before each exameple
            bnbSwapBalanceAfter = await token.balanceOf(bnbSwap.address);

            result = await bnbSwap.buyTokens({from: investor, value: web3.utils.toWei('10', 'ether')});
        }) 
        it('Allows user to instantly purchase tokens from bnbSwap for a calculated price', async () => {            
            // Check investor token balance after purchase
            let investorBalance = await token.balanceOf(investor);
            /*
            let initalRate = await bnbSwap.getEstimatedRateBuySell();
            console.log(initalRate.toString());
            */
            //console.log(investorBalance.toString());
            
           //let amountTokens_Surplus = await bnbSwap.getRateBuy(web3.utils.toWei('1', 'ether'));
           //console.log(amountTokens_Surplus.toString());
            assert.notEqual(investorBalance.toString(), '0');
            let bnbSwapBalanceBefore = await token.balanceOf(bnbSwap.address);
            assert.notEqual(bnbSwapBalanceAfter, bnbSwapBalanceBefore);
        
            const event = result.logs[0].args;
            //console.log(event.amount.toString());
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);
            tokensBought = await token.balanceOf(investor);
            //console.log(result.logs)
            
        })
    })

        describe('sellTokens()', async => {
        before(async () => {
            // Purchase tokens before each exameple
            bnbSwapBalanceAfter = await token.balanceOf(bnbSwap.address);
            // Investor must aprove tokens beforte purchase
            await token.approve(bnbSwap.address, tokensBought, {from: investor});
            // Investor sells tokens
            let investorBalance = await token.balanceOf(investor);
            //console.log(investorBalance.toString());
            //console.log(tokensBought.toString());
            //console.log((await bnbSwap.getSellInfo(investorBalance.toString())).toString());
            result  = await bnbSwap.sellTokens(tokensBought, {from: investor});
            
            
            //console.log("investor tokens: "+investorBalance.toString());
        }) 
        it('Allows user to instantly sell tokens from bnbSwap for a calculated price', async () => {            
            let investorBalance = await token.balanceOf(investor);
            
            assert.equal(investorBalance.toString(), tokens('0'));

            const event = result.logs[0].args;
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);

            // FAILURE: investor can't sell more tokens than they have
            await bnbSwap.sellTokens(tokens('500'), {from: investor}).should.be.rejected;
        })
    })

})