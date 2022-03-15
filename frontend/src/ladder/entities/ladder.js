import Ranker from "@/ladder/entities/ranker";
import Decimal from "break_infinity.js";

class Ladder {
  constructor(data) {
    this.ladderNumber = data.currentLadder.number;
    this.rankers = [];
    data.rankers.forEach((ranker) => {
      const r = new Ranker(ranker);
      this.rankers.push(r);
    });
    this.startRank = data.startRank;
    this.yourRanker = new Ranker(data.yourRanker);
    this.firstRanker = new Ranker(data.firstRanker);
  }

  static placeholder() {
    const ranker = Ranker.placeholder();
    return new Ladder({
      currentLadder: { number: 1 },
      rankers: [ranker],
      startRank: 1,
      yourRanker: ranker,
      firstRanker: ranker,
    });
  }

  calculate(delta, settings) {
    /*this.rankers = this.rankers.sort((a, b) =>
      new Decimal(a.points).sub(b.points)
    );*/


    performance.mark("start");
    let rankers = [...this.rankers];
    performance.mark("sort");
    // ladderStats.growingRankerCount = 0;
    for (let i = 0; i < rankers.length; i++) {
      let ranker = new Ranker(rankers[i]);
      if (this.yourRanker.accountId === ranker.accountId)
        this.yourRanker = ranker;
      ranker.rank = i + 1;
      // If the ranker is currently still on ladder
      if (ranker.growing) {
        // ladderStats.growingRankerCount += 1;
        // Calculating Points & Power
        if (ranker.rank !== 1)
          ranker.power = ranker.power.add(
            new Decimal((ranker.bias + ranker.rank - 1) * ranker.multiplier)
              .mul(new Decimal(delta))
              .floor()
          );
        ranker.points = ranker.points.add(ranker.power.mul(delta).floor());

        // Calculating Vinegar based on Grapes count
        if (ranker.rank !== 1 && ranker.you)
          ranker.vinegar = ranker.vinegar.add(ranker.grapes.mul(delta).floor());

        if (ranker.rank === 1 && ranker.you && this.isLadderUnlocked(settings))
          ranker.vinegar = ranker.vinegar.mul(Math.pow(0.9975, delta)).floor();

        rankers[i] = ranker;

        for (let j = i - 1; j >= 0; j--) {
          // If one of the already calculated Rankers have less points than this ranker
          // swap these in the list... This way we keep the list sorted, theoretically
          let currentRanker = rankers[j + 1];
          if (currentRanker.points.cmp(rankers[j].points) > 0) {
            // Move 1 Position up and move the ranker there 1 Position down

            // Move other Ranker 1 Place down
            rankers[j].rank = j + 2;
            if (
              rankers[j].growing &&
              rankers[j].you &&
              rankers[j].multiplier > 1
            )
              rankers[j].grapes = rankers[j].grapes.add(new Decimal(1));
            rankers[j + 1] = rankers[j];

            // Move this Ranker 1 Place up
            currentRanker.rank = j + 1;
            rankers[j] = currentRanker;
          } else {
            break;
          }
        }
      }
    }
    performance.mark("end");
    this.rankers = rankers;
    performance.mark("saved");
    // Ranker on Last Place gains 1 Grape, only if he isn't the only one
    if (
      this.rankers.length >=
      Math.max(settings.minimumPeopleForPromote, this.ladderNumber)
    ) {
      let index = this.rankers.length - 1;
      if (this.rankers[index].growing && this.rankers[index].you)
        this.rankers[index].grapes = this.rankers[index].grapes.add(
          new Decimal(3).mul(delta).floor()
        );
    }

    this.firstRanker = this.rankers[0];
    performance.mark("done")
    performance.measure("calculate", "start", "end");
    performance.measure("save", "end", "saved");
    performance.measure("everything", "start", "done");

    console.info();
    console.info("calculate", performance.getEntriesByName("calculate")[0].duration);
    console.info("save", performance.getEntriesByName("save")[0].duration);
    console.info("everything", performance.getEntriesByName("everything")[0].duration);
    performance.clearMeasures();
  }

  multiRanker(accountId) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId && ranker.growing) {
        ranker.multiplier += 1;
        ranker.bias = 0;
        ranker.points = new Decimal(0);
        ranker.power = new Decimal(0);
      }
    });
  }

  biasRanker(accountId) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId && ranker.growing) {
        ranker.bias += 1;
        ranker.points = new Decimal(0);
      }
    });
  }

  softResetRanker(accountId) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId) {
        ranker.points = new Decimal(0);
      }
    });
  }

  changeName(accountId, newName) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId) {
        ranker.username = newName;
      }
    });
  }

  addNewRanker(accountId, username, timesAsshole) {
    let newRanker = new Ranker({
      accountId: accountId,
      username: username,
      points: new Decimal(0),
      power: new Decimal(1),
      bias: 0,
      multiplier: 1,
      you: false,
      growing: true,
      timesAsshole: timesAsshole,
    });

    if (!this.rankers.find((r) => r.accountId === accountId && r.growing)) {
      this.rankers.push(newRanker);
    }
  }

  autoPromoteRanker(accountId, settings) {
    this.rankers.forEach((ranker) => {
      if (ranker.you && accountId === ranker.accountId) {
        ranker.grapes = ranker.grapes.sub(
          this.getAutoPromoteCost(this.ladderNumber, ranker.rank, settings)
        );
        ranker.autoPromote = true;
      }
    });
  }

  promoteRanker(accountId) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId) {
        ranker.growing = false;
      }
    });
  }

  resetVinegarOfRanker(accountId) {
    this.rankers.forEach((ranker) => {
      if (accountId === ranker.accountId) {
        if (ranker.you) ranker.vinegar = new Decimal(0);
      }
    });
  }

  getMinimumPointsForPromote(settings) {
    return settings.pointsForPromote.mul(this.ladderNumber);
  }

  getAutoPromoteCost(rank, settings) {
    let minPeople = this.getMinimumPeopleForPromote(settings);
    let divisor = Math.max(rank - minPeople + 1, 1);
    return settings.baseGrapesNeededToAutoPromote.div(divisor).floor();
  }

  getMinimumPeopleForPromote(settings) {
    return Math.max(settings.minimumPeopleForPromote, this.ladderNumber);
  }

  isLadderUnlocked(settings) {
    if (this.rankers.length <= 0) return false;
    let rankerCount = this.rankers.length;
    if (
      rankerCount < this.getMinimumPeopleForPromote(this.ladderNumber, settings)
    )
      return false;
    return (
      this.firstRanker.points.cmp(this.getMinimumPointsForPromote(settings)) >=
      0
    );
  }

  canThrowVinegar(settings) {
    return (
      this.firstRanker.growing &&
      !this.firstRanker.you &&
      this.firstRanker.points.cmp(settings.pointsForPromote) >= 0 &&
      this.rankers.length >= settings.minimumPeopleForPromote &&
      this.yourRanker.vinegar.cmp(this.getVinegarThrowCost(settings)) >= 0
    );
  }

  getNextUpgradeCost(currentUpgrade) {
    return new Decimal(
      Math.round(Math.pow(this.ladderNumber + 1, currentUpgrade + 1))
    );
  }

  getVinegarThrowCost(settings) {
    return settings.baseVinegarNeededToThrow.mul(
      new Decimal(this.ladderNumber)
    );
  }
}

export default Ladder;
