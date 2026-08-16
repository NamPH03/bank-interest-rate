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

export function registerAllCrawlers(): void {
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
}

// Auto-register on import
registerAllCrawlers();
