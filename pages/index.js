import { useState, useEffect } from 'react'
import Head from 'next/head'
import Web3 from 'web3'
import lotteryContract from '../blockchain/lottery'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import Image from 'next/image'
import artwork from '../public/artwork.png'

export default function Home() {
  const [web3, setweb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState()
  const [lotteryPlayers, setPlayers] = useState([])
  const [lotteryHistory, setLotteryHistory] = useState([])
  const [lotteryId, setLotteryId] = useState()
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    updateState()
  }, [lcContract])

  const updateState = () => {
    if (lcContract) getPlayers()
    if (lcContract) getLotteryId()
  }

  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setPlayers(players)
  }

  const getHistory = async (id) => {
    setLotteryHistory([])
    for (let i =parseInt(id); i > 0; i--) {
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotteryId)
    await getHistory(lotteryId)
  }

  const enterLotteryHandler = async () => {
    setError("")
    try {
      await lcContract.methods.enter().send({
        from: address,
        gasPrice: null
      })
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const pickWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    console.log(`address from pick winner :: ${address}`)
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gasPrice: null
      })
      setSuccessMsg("Already picked")
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const mintWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    try {
      await lcContract.methods.mintWinner().send({
        from: address,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)
      updateState()
    } catch(err) {
      setError(err.message)
    }
  }

  const connectWalletHandler = async () => {
    setError("")
    setSuccessMsg('')
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefinend") {
      try {
        //request wallet connection
        await window.ethereum.request({ method: "eth_requestAccounts" })
        //create web3 instance
        const web3 = new Web3(window.ethereum);
        setweb3(web3)
        // get list of accounts
        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0])
        // create local contract copy
        const lc = lotteryContract(web3)
        setLcContract(lc)

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          setAddress(accounts[0])
        })
      } catch(err) {
        setError(err.message)
      }
    } else {
      alert("Please install Matamask")
    }
  }

  return (
    <div>
      <Head>
        <title>Lottery dApp</title>
        <meta name="description" content="An Ethereum Lottery dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className='navbar mt-4 mb-4'>
          <div className='container'>
            <div className='navbar-brand'>
              <h1>Lottery dApp</h1>
            </div>
            <div className='navbar-end'>
              
              <button onClick={connectWalletHandler} className='button is-link'>
                <strong>Connect Wallet</strong>
              </button>
            </div>
          </div>
        </nav>

        <div className='container'>
          <section className='mt-5'>
            <div className='columns'>
              <div className='column is-two-thirds'>
                <p className='container'><b>Connect wallet is </b>{address}</p>
                <section className='mt-5'>
                  <p className=''><b>Anyone can participate :</b> Enter the lottery</p>
                  <button onClick={enterLotteryHandler} className='button is-danger is-large is-rounded mt-3'>
                    <strong>Play now</strong>
                  </button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin only :</b> At least 2 people required</p>
                  <button onClick={pickWinnerHandler} className='button is-primary is-large is-rounded mt-3'>
                    <strong>Pick winner</strong>
                  </button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin only :</b> Airdropped on the WINNER</p>
                  <button onClick={mintWinnerHandler} className='button is-success is-large is-rounded mt-3'>
                  <strong>Mint winner</strong>
                  </button>
                </section>
                <section>
                  <div className='container has-text-danger mt-6'>
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className='container has-text-success mt-6'>
                    <p>{successMsg}</p>
                  </div>
                </section>
              </div>

              <div className={`${styles.lotteryInfo} column is-one-third`}>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Lottery History</h2>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className='history-entry mt-3' key={item.id}>
                                <div>Lottery #{item.id} winner:</div>
                                <div>
                                  <a href={`https://rinkeby.etherscan.io/address/${item.address}`} target="_blank" rel="noopener noreferrer">
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })
                        }
                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Player ({lotteryPlayers.length})</h2>
                        <ul className='ml-0'>
                          {
                            (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player, index) => {
                              return <li key={`${player}-${index}`}>
                                <a href={`https://rinkeby.etherscan.io/address/${player}`}target="_blank" rel="noopener noreferrer">
                                  {player}
                                </a>
                              </li>
                            })
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Reward</h2>
                        <Image
                          src={artwork}
                          alt="Placeholder image"
                          width={200}
                          height={200}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>2022 Block Explorer</p>
      </footer>
    </div>
  )
}