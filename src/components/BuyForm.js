import React, { Component } from 'react'
import tokenLogo from '../token-logo.png'
import bnbLogo from '../bnb-logo.png'
const web3 = require('../../node_modules/web3')
const BN = require('../../node_modules/bn.js');

function toWeiEther(amount){
    console.log("toWeiEther: "+amount);
    return web3.utils.toWei(amount, "Ether");
}

function fromWeiEther(amount){
  let a = window.web3.utils.fromWei(amount, "Ether");
  console.log("fromWeiEther: "+amount," --> ",a);
    try{
    
    }
    catch(e){
      console.log(e);
      
    }
    return a;
}

class BuyForm extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      input: '0',
      output: '0',
      rate: this.props.rate,
      bnbBalance: this.props.bnbBalance,
      tokenBalance: this.props.tokenBalance
    }
  }

  render() {
      let maxInput = window.web3.utils.toWei('100', 'Ether');
      let validInput = Number(this.state.input)<=Number(this.props.bnbBalance) && Number(this.state.input)<=Number(maxInput);
      let nonZeroInput = Number(this.state.input!=0);
      console.log("input: "+this.state.input)
      //console.log(this.state.input+" "+this.props.bnbBalance+" "+this.props.tokenExchangeBalance+" "+window.web3.utils.fromWei(maxInput))
      /*console.log(             
             Number(window.web3.utils.fromWei(this.state.input)) +" "+
             Number(window.web3.utils.fromWei(this.props.bnbBalance.toString())) + " " +
             Number(window.web3.utils.fromWei(this.props.tokenExchangeBalance.toString())) +" "+
             Number(window.web3.utils.fromWei(maxInput.toString())) +" "+
             ((window.web3.utils.fromWei(new BN(this.props.tokenExchangeBalance.toString(), 10))*Number(this.state.rate)).toString())
             );
             */
          console.log("AAA: "+
             Number(fromWeiEther(this.props.bnbBalance.toString()))+" "+
             Number(fromWeiEther(new BN((this.props.tokenExchangeBalance/Number(this.state.rate)).toString())))+" "+
             Number(fromWeiEther(maxInput.toString()))
             )
      let validOutput =  Number(this.state.output)<=Number(this.props.tokenExchangeBalance);
      console.log(validInput+" "+validOutput)
      //console.log(this.props.tokenExchangeBalance)
      let content;
      if (!validInput || nonZeroInput){
          content = <div className="mb-3"  style={{ color: 'red' }} >MAX: {
            Math.min(
             Number(fromWeiEther(this.props.bnbBalance.toString())),
             Number(fromWeiEther(new BN((this.props.tokenExchangeBalance/Number(this.state.rate)).toString()))),
             Number(fromWeiEther(maxInput.toString()))
             )}
             </div>

          //this.setState({output: '0'});
      }
      else if(!validInput){
        content = <div className="mb-3"  style={{ color: 'red' }} >MAX: {
          window.web3.utils.fromWei(this.props.bnbBalance)
        }</div>
      }
      else if(!validOutput){
        content = <div className="mb-3"  style={{ color: 'red' }} >MAX: {
          window.web3.utils.fromWei(this.props.tokenExchangeBalance)
        }</div>
      }
      
     return (
        <form className="mb-3" onSubmit={(event) => {
            event.preventDefault()
            let bnbAmount
            bnbAmount = this.input.value.toString()
            bnbAmount = window.web3.utils.toWei(bnbAmount, 'Ether')
            this.props.buyTokens(bnbAmount);
            let bnbBalance;
            bnbBalance = window.web3.eth.getBalance(this.props.account).then(function(result){bnbBalance=result});
            //console.log(Number(window.web3.eth.getBalance(this.props.account)).toString());
            this.setState({bnbBalance});
            let tokenBalance = async () => {
            return await this.props.token.methods.balanceOf(this.props.account).call();
            }
            this.setState({tokenBalance})
          }}>
          <div>
            <label className="float-left"><b>Input</b></label>
            <span className="float-right text-muted">
              Balance: {window.web3.utils.fromWei(this.props.bnbBalance.toString(), 'Ether')}
            </span>
          </div>
          <div className="input-group mb-4">
            <input
              type="text"
              onChange={async (event) => {
                let buyInfo, bnbWeiAmount, maxAmount=false;
                var bnbAmount = this.input.value.toString();
                bnbAmount = Number(bnbAmount);
                let correctAmount = !(isNaN(bnbAmount));
                if (correctAmount){
                  bnbWeiAmount = window.web3.utils.toWei(bnbAmount.toString(), 'Ether');
                  buyInfo = await this.props.bnbSwap.methods.getBuyInfo(bnbWeiAmount).call().catch((error) => 
                  {maxAmount = true;
                    this.setState({
                        input : Infinity
                  })});
                  correctAmount = (buyInfo !== null && buyInfo !== undefined);
                }
              if (correctAmount){
                this.setState({
                input: bnbWeiAmount,
                output: Number(buyInfo[0]/10**this.props.decimals).toString(),
                rate: Number(buyInfo[1]).toString()
                  //output: buyInfo[1]
                  //output: bnbAmount * buyInfo[0]/(10**(this.props.decimals))
                })
              }
              else if(!maxAmount){
                this.setState({
                  input: '0',
                  output: '0',
                  rate: this.props.rate
                })
              }
              }}
              ref={(input) => { this.input = input }}
              className="form-control form-control-lg"
              placeholder="0"
              required />
            <div className="input-group-append">
              <div className="input-group-text">
                <img src={bnbLogo} height='32' alt=""/>
                    BNB
              </div>
            </div>
          </div>
          {content}
          <div>
            <label className="float-left"><b>Output</b></label>
            <span className="float-right text-muted">
              Balance: {window.web3.utils.fromWei(this.props.tokenBalance, 'Ether')}
            </span>
          </div>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="0"
              value={this.state.output}
              disabled
            />
            <div className="input-group-append">
              <div className="input-group-text">
                <img src={tokenLogo} height='32' alt=""/>
                  SMTK
              </div>
            </div>
          </div>
          <div className="mb-5">
            <span className="float-left text-muted">Exchange Rate</span>
            <span className="float-right text-muted">1 BNB ≃ {this.state.rate} SMTK</span>
          </div>
          
          <button disabled={!validInput || nonZeroInput} type="submit" className="btn btn-primary btn-block btn-lg">SWAP!</button>
        </form>

    );
  }
}

export default BuyForm;