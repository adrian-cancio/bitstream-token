import React, { Component } from 'react'
import BuyForm from "./BuyForm.js";
import SellForm from './SellForm.js';

class Main extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      currentForm: (localStorage.getItem("BuyOrSell") === "sell" ? "sell" : "buy")
    }
  }

  render() {
      let content;
      if (this.state.currentForm === 'buy'){
          content = <BuyForm
      bnbBalance={this.props.bnbBalance}
      tokenBalance={this.props.tokenBalance}
      buyTokens={this.props.buyTokens}
      rate={this.props.rate}
      decimals = {this.props.decimals}
      bnbSwap={this.props.bnbSwap}
      account={this.props.account}
      tokenExchangeBalance={this.props.tokenExchangeBalance}
      />
      }
      else{
        content = <SellForm
        bnbBalance={this.props.bnbBalance}
        tokenBalance={this.props.tokenBalance}
        sellTokens={this.props.sellTokens}
        rate={this.props.rate}
        decimals = {this.props.decimals}
        bnbSwap={this.props.bnbSwap}
        account={this.props.account}
        bnbExchangeBalance={this.props.bnbExchangeBalance}
        />
      }
      
      return (
        <div id="content" className="mt-3">
  
          <div className="d-flex justify-content-between mb-3">
            <button
                className="btn btn-light"
                onClick={(event) => {
                  this.setState({ currentForm: 'buy' })
                  localStorage.setItem("BuyOrSell", "buy")
                }}
              >
              Buy
            </button>
            <span className="text-muted">&lt; &nbsp; &gt;</span>
            <button
                className="btn btn-light"
                onClick={(event) => {
                  this.setState({ currentForm: 'sell' })
                  localStorage.setItem("BuyOrSell", "sell")
                }}
              >
              Sell
            </button>
          </div>
  
          <div className="card mb-4" >
  
            <div className="card-body">
  
              {content}
  
            </div>
  
          </div>
  
        </div>
      );
  }
}

export default Main;