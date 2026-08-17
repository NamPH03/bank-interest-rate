import { crawlerRegistry } from "./base/CrawlerRegistry";
import { VietcombankCrawler } from "./vietcombank/VietcombankCrawler";
import { TechcombankCrawler } from "./techcombank/TechcombankCrawler";
import { BidvCrawler } from "./bidv/BidvCrawler";
import { VietinbankCrawler } from "./vietinbank/VietinbankCrawler";
import { AgribankCrawler } from "./agribank/AgribankCrawler";
import { MbCrawler } from "./mb/MbCrawler";
import { VpbankCrawler } from "./vpbank/VpbankCrawler";
import { AcbCrawler } from "./acb/AcbCrawler";
import { HdbankCrawler } from "./hdbank/HdbankCrawler";
import { SacombankCrawler } from "./sacombank/SacombankCrawler";
import { ShbCrawler } from "./shb/ShbCrawler";
import { LpbankCrawler } from "./lpbank/LpbankCrawler";
import { VibCrawler } from "./vib/VibCrawler";
import { TpbankCrawler } from "./tpbank/TpbankCrawler";
import { MsbCrawler } from "./msb/MsbCrawler";
import { SeabankCrawler } from "./seabank/SeabankCrawler";
import { OcbCrawler } from "./ocb/OcbCrawler";
import { EximbankCrawler } from "./eximbank/EximbankCrawler";
import { NamabankCrawler } from "./namabank/NamabankCrawler";
import { BacabankCrawler } from "./bacabank/BacabankCrawler";

export function registerAllCrawlers(): void {
  // Top 10 Core
  crawlerRegistry.register(new VietcombankCrawler());
  crawlerRegistry.register(new TechcombankCrawler());
  crawlerRegistry.register(new BidvCrawler());
  crawlerRegistry.register(new VietinbankCrawler());
  crawlerRegistry.register(new AgribankCrawler());
  crawlerRegistry.register(new MbCrawler());
  crawlerRegistry.register(new VpbankCrawler());
  crawlerRegistry.register(new AcbCrawler());
  crawlerRegistry.register(new HdbankCrawler());
  crawlerRegistry.register(new SacombankCrawler());

  // 10 Expanded Banks
  crawlerRegistry.register(new ShbCrawler());
  crawlerRegistry.register(new LpbankCrawler());
  crawlerRegistry.register(new VibCrawler());
  crawlerRegistry.register(new TpbankCrawler());
  crawlerRegistry.register(new MsbCrawler());
  crawlerRegistry.register(new SeabankCrawler());
  crawlerRegistry.register(new OcbCrawler());
  crawlerRegistry.register(new EximbankCrawler());
  crawlerRegistry.register(new NamabankCrawler());
  crawlerRegistry.register(new BacabankCrawler());
}

// Auto-register on import
registerAllCrawlers();
