import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log(quote ? 'SUCCESS' : 'NO DATA');
  } catch (e) {
    console.error(e);
  }
}

test();
