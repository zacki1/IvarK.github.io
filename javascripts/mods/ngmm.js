function getGSAmount() {
	if (isEmptiness) return new Decimal(0)
	let galaxies = player.galaxies + player.replicanti.galaxies + player.dilation.freeGalaxies;
	let y = 1.5 
	if (false) {
		y += Math.max(0, 0.05*(galaxies - 10)) + 0.005 * Math.pow(Math.max(0, galaxies-30) , 2) + 0.0005 * Math.pow(Math.max(0, galaxies-50) , 3)
		y *= .08*player.challenges.length
		if (y>100) y = Math.pow(316.22*y,1/3)
		else if (y>10) y = Math.pow(10*y , .5)
	}
	let ret = new Decimal(Math.pow(Math.max(galaxies, 0), y) * Math.max(player.resets - (player.currentChallenge=="challenge4"?2:4), 0));
	ret = ret.times(player.eightAmount/50+1)
	if (player.galacticSacrifice.upgrades.includes(32)) ret = ret.times(galUpgrade32())
	if (player.infinityUpgrades.includes("galPointMult")) ret = ret.times(getPost01Mult())
	if (player.achievements.includes('r37')) {
		if (player.bestInfinityTime <= 18000) ret = ret.times(180000 / player.bestInfinityTime)
		else ret = ret.times(10 * (1 + Math.pow(Math.log10(18000 / player.bestInfinityTime), 2)))
	}
	if (player.achievements.includes("r62")) ret = ret.times(Math.max(1, player.infinityPoints.log10()))
	return ret.floor()
}

function galacticSacrifice(auto) {
	if (!player.break && player.money.gt(Number.MAX_VALUE)) return;
	if (getGSAmount().eq(0)) return
	if (player.options.gSacrificeConfirmation&&!auto) if (!confirm("Galactic Sacrifice will do a galaxy reset, and then remove all of your galaxies, in exchange of galaxy points which can be use to buy many overpowered upgrades, but it will take a lot of time to recover, are you sure you wanna do this?")) return
	player.galacticSacrifice.galaxyPoints = player.galacticSacrifice.galaxyPoints.plus(getGSAmount())
	player.galaxies = -1
	player.galacticSacrifice.times++
	player.galacticSacrifice.time = 0
	GPminpeak = new Decimal(0)
	galaxyReset()
}

function resetGalacticSacrifice() {
	return player.galacticSacrifice ? {
		galaxyPoints: new Decimal(0),
		time: 0,
		times: 0,
		upgrades: []
	} : undefined
}

function newGalacticDataOnInfinity() {
	if (player.galacticSacrifice&&player.achievements.includes("r36")) {
		var data=player.galacticSacrifice
		data.galaxyPoints=data.galaxyPoints.add(getGSAmount())
		data.time=0
		return data
	} else return resetGalacticSacrifice()
}

function isIC3Trapped() {
	return (!player.challenges.includes("postc3") && player.galacticSacrifice) || player.currentEternityChall === "eterc14" || inQC(6)
}

//v1.2

let galUpgradeCosts = {
	11: 1,
	12: 3,
	13: 20,
	21: 1,
	22: 5,
	23: 100,
	31: 2,
	32: 8,
	33: 1000
}

function buyGalaxyUpgrade(i) {
	if (player.galacticSacrifice.upgrades.includes(i) || !(Math.floor(i/10)<2 || player.galacticSacrifice.upgrades.includes(i-10)) || player.galacticSacrifice.galaxyPoints.lt(galUpgradeCosts[i])) return
	player.galacticSacrifice.upgrades.push(i)
	player.galacticSacrifice.galaxyPoints = player.galacticSacrifice.galaxyPoints.sub(galUpgradeCosts[i])
	if (i==11) {
		if (player.achievements.includes("r21")) {
			for (d=1;d<9;d++) {
				var name = TIER_NAMES[d]
				player[name+"Cost"] = player[name+"Cost"].times(10)
			}
		}
		reduceDimCosts()
	}
}

function reduceDimCosts() {
	if (player.galacticSacrifice) {
		if (player.galacticSacrifice.upgrades.includes(11)) {
			for (d=1;d<9;d++) {
				var name = TIER_NAMES[d]
				player[name+"Cost"] = player[name+"Cost"].div(galUpgrade11())
			}
		} else if (player.achievements.includes("r21")) {
			for (d=1;d<9;d++) {
				var name = TIER_NAMES[d]
				player[name+"Cost"] = player[name+"Cost"].div(10)
			}
		}
	}
}

let galUpgrade11 = function () {
	let x = player.infinitied;
	let y;
	if (x < 1) {
		y = 2;
	} else if (x < 5) {
		y = x + 2;
	} else if (x < 100) {
		y = Math.pow(x + 5, .5) + 4;
	} else {
		y = Math.pow(Math.log(x), Math.log(x) / 10) + 14;
	}
	return Decimal.pow(10, y);
}
let galUpgrade12 = function () {
	return 2 * Math.pow(1 + player.galacticSacrifice.time / 600, 0.5);
}
let galUpgrade13 = function () {
	return player.galacticSacrifice.galaxyPoints.div(5).plus(1).pow(3)
}
let galUpgrade23 = function () {
	return player.galacticSacrifice.galaxyPoints.max(1).log10()*3/4+1
}
let galUpgrade31 = function () {
	return 1.1 + player.extraDimPowerIncrease * 0.02
}
let galUpgrade32 = function () {
	let x = player.totalmoney
	if (!player.break) x = x.min(Number.MAX_VALUE)
	return x.pow(0.003).add(1);
}
let galUpgrade33 = function () {
	return player.galacticSacrifice.galaxyPoints.max(1).log10()/4+1
}

function galacticUpgradeSpanDisplay () {
	document.getElementById('galspan11').innerHTML = shortenDimensions(galUpgrade11())
	document.getElementById('galspan12').innerHTML = shorten(galUpgrade12())
	document.getElementById('galspan13').innerHTML = shorten(galUpgrade13())
	document.getElementById('galspan23').innerHTML = shorten(getDimensionBoostPower().times(player.galacticSacrifice.upgrades.includes(23)?1:galUpgrade23()))
	document.getElementById('galspan31').innerHTML = galUpgrade31().toFixed(2)
	document.getElementById('galspan32').innerHTML = shorten(galUpgrade32())
	document.getElementById('galspan33').innerHTML = shorten(getDimensionPowerMultiplier(true)*(player.galacticSacrifice.upgrades.includes(33)?1:galUpgrade33()))
	document.getElementById('galcost33').innerHTML = shortenCosts(1e3)
}

function galacticUpgradeButtonTypeDisplay () {
	for (let i = 1; i <= 3; i++) {
		for (let j = 1; j <= 3; j++) {
			let e = document.getElementById('galaxy' + i + j);
			if (player.galacticSacrifice.upgrades.includes(+(i + '' + j))) {
				e.className = 'infinistorebtnbought'
			} else if (player.galacticSacrifice.galaxyPoints.gte(galUpgradeCosts[i + '' + j]) && (i === 1 || player.galacticSacrifice.upgrades.includes(+((i - 1) + '' + j)))) {
				e.className = 'infinistorebtn' + j;
			} else {
				e.className = 'infinistorebtnlocked'
			}
		}
	}
}

//v1.295
function resetTotalBought() {
	if (player.galacticSacrifice) return {}
}

function productAllTotalBought () {
	var ret = 1;
	for (i = 1; i <= 8; i++) {
		if (player.totalBoughtDims[TIER_NAMES[i]]) ret *= Math.max(player.totalBoughtDims[TIER_NAMES[i]] ? player.totalBoughtDims[TIER_NAMES[i]] : 1, 1);
	}
	return ret;
}

function productAllTotalBought1 () {
	return Math.pow(Math.log10(Math.max(productAllTotalBought(), 10)), 2);
}

function productAllDims1(){
	var ret = 0;
	for (i = 1; i <= 8; i++) {
		ret += Math.max(player[TIER_NAMES[i] + "Amount"].log10(), 0);
	}
	return Math.min(1,ret);
}

document.getElementById("challenge13").onclick = function () {
	startChallenge("challenge13", Number.MAX_VALUE);
}

//v1.3
function gSacrificeConf() {
	document.getElementById("gConfirmation").checked = player.options.gSacrificeConfirmation
	player.options.gSacrificeConfirmation = !player.options.gSacrificeConfirmation
	document.getElementById("gSacConfirmBtn").textContent = "Galactic Sacrifice confirmation: O" + (player.options.gSacrificeConfirmation ? "N" : "FF")
}

document.getElementById("challenge14").onclick = function () {
	startChallenge("challenge14", Number.MAX_VALUE);
}

function updateTBTIonGalaxy() {
	if (player.galacticSacrifice) return {current:player.tickBoughtThisInf.current,pastResets:[{resets:0,bought:player.tickBoughtThisInf.current}]}
}

function resetTickBoughtThisInf() {
	if (player.galacticSacrifice) return {current:0,pastResets:[{resets:0,bought:0}]}
}

function upgradeSacAutobuyer() {
	if (player.infinityPoints.lt(player.autoSacrifice.cost)) return false;
	player.infinityPoints = player.infinityPoints.minus(player.autoSacrifice.cost);
	if (player.autoSacrifice.interval > 100) {
		player.autoSacrifice.interval = Math.max(player.autoSacrifice.interval*0.6, 100);
		if (player.autoSacrifice.interval > 120) player.autoSacrifice.cost *= 2; //if your last purchase wont be very strong, dont double the cost
	}
	updateAutobuyers();
}

document.getElementById("buyerBtnGalSac").onclick = function () {
	buyAutobuyer(12);
}

//v1.4
function getPost01Mult() {
	return Math.min(Math.pow(player.infinitied + 1, .3), Math.pow(Math.log(player.infinitied + 3), 3))
}

document.getElementById("postinfi01").onclick = function() {
	buyInfinityUpgrade("galPointMult",1e3);
}

document.getElementById("postinfi02").onclick = function() {
	buyInfinityUpgrade("dimboostCost",2e4);
}

document.getElementById("postinfi03").onclick = function() {
	buyInfinityUpgrade("galCost",5e5);
}

document.getElementById("postinfi04").onclick = function() {
	if (player.infinityPoints.gte(player.dimPowerIncreaseCost) && player.extraDimPowerIncrease < 25) {
		player.infinityPoints = player.infinityPoints.minus(player.dimPowerIncreaseCost)
		player.dimPowerIncreaseCost = 1e3*Math.pow(4,player.extraDimPowerIncrease+1);
		player.extraDimPowerIncrease += 1;
		if (player.extraDimPowerIncrease > 15) player.dimPowerIncreaseCost = player.dimPowerIncreaseCost*Math.pow(125,player.extraDimPowerIncrease-5)
		document.getElementById("postinfi04").innerHTML = "Dimension multipliers are further increased by g31 <br>x^" + galUpgrade31().toFixed(2) + ' -> ' + (galUpgrade31() + .02).toFixed(2) + '</br> Cost: ' + formatValue(player.options.notation, player.dimPowerIncreaseCost, 2, 2) + ' IP';
		if (player.extraDimPowerIncrease >= 25) document.getElementById("postinfi04").innerHTML = "Dimension multipliers are further increased by g31 <br>x^" + galUpgrade31().toFixed(2);
	}
}