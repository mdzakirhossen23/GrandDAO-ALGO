
import "../public/theme.css";
import "../public/output.css";
import "../public/css/ideas.css";
import "../public/css/daos.css";
import { ThemeProvider } from 'next-themes'
import { SnackbarProvider } from "notistack";
import { UtilsProvider } from "../contexts/UtilsContext";
import { AlgoContext } from "../contexts/AlgoContext";
import { WormholeContext } from "../contexts/WormholeContext";
import { WalletProvider, useInitializeProviders, PROVIDER_ID } from '@txnlab/use-wallet'
import { PeraWalletConnect } from '@perawallet/connect'
import algosdk, { ABIType, ABIValue, Algodv2 } from 'algosdk';
import { algodToken, algodServer, kmdServer, algodPort, network, wallet, password } from '../services/useContract'

function MyApp({ Component, pageProps }) {

  let providersArray
  if (network === '') {
    providersArray = [
      {
        id: PROVIDER_ID.KMD,
        clientOptions: {

          host: kmdServer,
          token: algodToken,
          port: algodPort,
          wallet: wallet,
          password: password
        },
      },
    ]
  } else {
    providersArray = [
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },

    ]
  }




  const providers = useInitializeProviders({
    providers: providersArray,
    nodeConfig: {
      network: network,
      nodeServer: algodServer,
      nodePort: algodPort,
      nodeToken: algodToken,
    },
    algosdkStatic: algosdk,

  })

  return (
    <SnackbarProvider anchorOrigin={{ vertical: "top", horizontal: "right" }} maxSnack={5} autoHideDuration={3000} >
      <UtilsProvider>
        <WalletProvider value={providers} >
          <AlgoContext>
            <WormholeContext>
              <ThemeProvider defaultTheme={"dark"} enableColorScheme={false} attribute="class" enableSystem={false}>
                <Component {...pageProps} />
              </ThemeProvider>
            </WormholeContext>

          </AlgoContext>
        </WalletProvider>
      </UtilsProvider>
    </SnackbarProvider>
  );
}

export default MyApp;
