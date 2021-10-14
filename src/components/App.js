import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Token from '../abis/SMTKToken.json';
import BnbSwap from '../abis/BnbSwap.json';
import Navbar from './Navbar.js';
import Main from './Main.js';


class App extends Component {

  async componentWillMount(){
      await this.loadWeb3();
      //console.log(window.web3);
      this.loadBlockchainData();
    }

  handleAccountsChanged(accounts){
    
    if (accounts.length!==0) {
      this.setState({ 
        account : accounts[0],
        metamaskActive: true,
      });
      if (this.state.account !== localStorage.getItem('address')){
        localStorage.setItem("address", this.state.account);
        window.location.reload();
      }
       
    }
  }

  async loadBlockchainData(){
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.handleAccountsChanged(accounts);
    

    //console.log(this.state.account);
    if (this.state.metamaskActive){
    const bnbBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ bnbBalance });
    //console.log(this.state.bnbBalance);

    // Load token
    const networkId = await web3.eth.net.getId();
    const tokenData = Token.networks[networkId];
    if (tokenData){
      const token = new web3.eth.Contract(Token.abi, tokenData.address);
      console.log(token);
      this.setState( {token} );
      //console.log(token);
      let tokenBalance = await token.methods.balanceOf(this.state.account).call();
      //console.log("tokenBalance: "+tokenBalance);
      this.setState({ tokenBalance: tokenBalance.toString() });
      const decimals = await token.methods.decimals().call();
      this.setState({decimals});
      //const cs = await token.methods.getCirculatingSupply().call();
      //console.log(cs.toString());
    }
    else{
      window.alert("Token contract not deployed to detected network");
    }

    const bnbSwapData = BnbSwap.networks[networkId];
    if (bnbSwapData){
      const bnbSwap = new web3.eth.Contract(BnbSwap.abi, bnbSwapData.address);
      const rate = await bnbSwap.methods.getEstimatedRateBuySell().call();
      const bnbExchangeBalance = await web3.eth.getBalance(bnbSwapData.address);
      let tokenExchangeBalance = await this.state.token.methods.balanceOf(bnbSwapData.address).call();
      //console.log("Exchange Balance: "+tokenExchangeBalance.toString());
      console.log(rate.toString());
      this.setState({
        bnbSwap,
        rate : (rate == null ? '1' : rate.toString()),
        bnbExchangeBalance,
        tokenExchangeBalance})
    }
    else{
      window.alert("BnbSwap contract not deployed to detected network");
    }



    //console.log(this.state.bnbSwap);
    this.setState({ webMode: "buy-sell" });
    }
    else{
      this.setState({ webMode: "non-metamask"});
    }
  }

  // Comprobates if browser has MetaMask or any blockchain support
  async loadWeb3() {
    if (window.ethereum || window.web3) {
      window.web3 = new Web3(window.ethereum);
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
    
    
  }

  buyTokens = (etherAmount) => {
  this.setState({ webMode: "transaction" })
  this.state.bnbSwap.methods.buyTokens().send({ value: etherAmount, from: this.state.account, gas: '213213' }).on('transactionHash', (hash) => {})
  .on("confirmation", function(){window.alert("Transaction sucessful");window.location.reload()})
  .on("error", function(){window.alert("Transaction error");window.location.reload()})
  /*let bnbBalance;
            window.web3.eth.getBalance(this.state.account).then(function(result){this.setState({bnbBalance:result})});
            //console.log(this.state.bnbBalance);
            this.setState({bnbBalance});
            let tokenBalance = async () => {
            return await this.props.token.methods.balanceOf(this.state.account).call();
            }
            this.setState({tokenBalance : tokenBalance.toString()})
            */  

  
}

    sellTokens = (tokenAmount) => {
      this.setState({ webMode: "transaction" })
      this.state.token.methods.approve(this.state.bnbSwap.address, tokenAmount).send({ from: this.state.account}).on('transactionHash', (hash) => {
      this.state.bnbSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account, gas: '213213'}).on('transactionHash', (hash) => {})
      .on("confirmation", function(){window.alert("Transaction sucessful");window.location.reload()})
      .on("error", function(){window.alert("Transaction error");window.location.reload()})
      })
      
}



  constructor(props){
    super(props);
    this.state = {
      account: '',
      token: {},
      decimals: '18',
      bnbSwap: {},
      bnbBalance: '0',
      tokenBalance: '0',
      rate: '1',
      bnbExchangeBalance: '0',
      tokenExchangeBalance: '0',
      webMode: "loading",
      metamaskActive: false
    };
  }

  render() {
    window.ethereum.on('accountsChanged', accounts => {this.handleAccountsChanged(accounts);console.log(accounts);});
    let content;
    switch (this.state.webMode){
      case "loading":
         content = <p id="loader" className="text-center">Loading...</p>
         break;
      case "transaction":
          content = <p id="loader" className="text-center">Waiting until the transaction is confirmated...</p>
         break;
      case "non-metamask":
          content = <p id="loader" className="text-center">Please connect to metamask</p>
          break;
      default:
        content = <Main
        bnbBalance={this.state.bnbBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
        rate={this.state.rate}
        decimals = {this.state.decimals}
        bnbSwap={this.state.bnbSwap}
        account={this.state.account}
        bnbExchangeBalance={this.state.bnbExchangeBalance}
        tokenExchangeBalance={this.state.tokenExchangeBalance}
        />
    }
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{maxWidth: '600px'}}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>
                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
