<?php

/** PHPExcel root directory */
if (!defined('PHPEXCEL_ROOT')) {
    /**
     * @ignore
     */
    define('PHPEXCEL_ROOT', dirname(__FILE__) . '/../../');
    require(PHPEXCEL_ROOT . 'PHPExcel/Autoloader.php');
}

/** FINANCIAL_MAX_ITERATIONS */
define('FINANCIAL_MAX_ITERATIONS', 128);

/** FINANCIAL_PRECISION */
define('FINANCIAL_PRECISION', 1.0e-08);

/**
 * PHPExcel_Calculation_Financial
 *
 * Copyright (c) 2006 - 2015 PHPExcel
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * @category    PHPExcel
 * @package        PHPExcel_Calculation
 * @copyright    Copyright (c) 2006 - 2015 PHPExcel (http://www.codeplex.com/PHPExcel)
 * @license        http://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt    LGPL
 * @version        ##VERSION##, ##DATE##
 */
class PHPExcel_Calculation_Financial
{
    /**
     * isLastDayOfMonth
     *
     * Returns a boolean TRUE/FALSE indicating if this date is the last date of the month
     *
     * @param    DateTime    $testDate    The date for testing
     * @return    boolean
     */
    private static function isLastDayOfMonth($testDate)
    {
        return ($testDate->format('d') == $testDate->format('t'));
    }


    /**
     * isFirstDayOfMonth
     *
     * Returns a boolean TRUE/FALSE indicating if this date is the first date of the month
     *
     * @param    DateTime    $testDate    The date for testing
     * @return    boolean
     */
    private static function isFirstDayOfMonth($testDate)
    {
        return ($testDate->format('d') == 1);
    }


    private static function couponFirstPeriodDate($settlement, $maturity, $frequency, $next)
    {
        $months = 12 / $frequency;

        $result = PHPExcel_Shared_Date::ExcelToPHPObject($maturity);
        $eom = self::isLastDayOfMonth($result);

        while ($settlement < PHPExcel_Shared_Date::PHPToExcel($result)) {
            $result->modify('-'.$months.' months');
        }
        if ($next) {
            $result->modify('+'.$months.' months');
        }

        if ($eom) {
            $result->modify('-1 day');
        }

        return PHPExcel_Shared_Date::PHPToExcel($result);
    }


    private static function isValidFrequency($frequency)
    {
        if (($frequency == 1) || ($frequency == 2) || ($frequency == 4)) {
            return true;
        }
        if ((PHPExcel_Calculation_Functions::getCompatibilityMode() == PHPExcel_Calculation_Functions::COMPATIBILITY_GNUMERIC) &&
            (($frequency == 6) || ($frequency == 12))) {
            return true;
        }
        return false;
    }


    /**
     * daysPerYear
     *
     * Returns the number of days in a specified year, as defined by the "basis" value
     *
     * @param    integer        $year    The year against which we're testing
     * @param   integer        $basis    The type of day count:
     *                                    0 or omitted US (NASD)    360
     *                                    1                        Actual (365 or 366 in a leap year)
     *                                    2                        360
     *                                    3                        365
     *                                    4                        European 360
     * @return    integer
     */
    private static function daysPerYear($year, $basis = 0)
    {
        switch ($basis) {
            case 0:
            case 2:
            case 4:
                $daysPerYear = 360;
                break;
            case 3:
                $daysPerYear = 365;
                break;
            case 1:
                $daysPerYear = (PHPExcel_Calculation_DateTime::isLeapYear($year)) ? 366 : 365;
                break;
            default:
                return PHPExcel_Calculation_Functions::NaN();
        }
        return $daysPerYear;
    }


    private static function interestAndPrincipal($rate = 0, $per = 0, $nper = 0, $pv = 0, $fv = 0, $type = 0)
    {
        $pmt = self::PMT($rate, $nper, $pv, $fv, $type);
        $capital = $pv;
        for ($i = 1; $i<= $per; ++$i) {
            $interest = ($type && $i == 1) ? 0 : -$capital * $rate;
            $principal = $pmt - $interest;
            $capital += $principal;
        }
        return array($interest, $principal);
    }


    /**
     * ACCRINT
     *
     * Returns the accrued interest for a security that pays periodic interest.
     *
     * Excel Function:
     *        ACCRINT(issue,firstinterest,settlement,rate,par,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    $issue            The security's issue date.
     * @param    mixed    $firstinterest    The security's first interest date.
     * @param    mixed    $settlement        The security's settlement date.
     *                                    The security settlement date is the date after the issue date
     *                                    when the security is traded to the buyer.
     * @param    float    $rate            The security's annual coupon rate.
     * @param    float    $par            The security's par value.
     *                                    If you omit par, ACCRINT uses $1,000.
     * @param    integer    $frequency        the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer    $basis            The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function ACCRINT($issue, $firstinterest, $settlement, $rate, $par = 1000, $frequency = 1, $basis = 0)
    {
        $issue        = PHPExcel_Calculation_Functions::flattenSingleValue($issue);
        $firstinterest    = PHPExcel_Calculation_Functions::flattenSingleValue($firstinterest);
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $rate        = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $par        = (is_null($par))        ? 1000 :    PHPExcel_Calculation_Functions::flattenSingleValue($par);
        $frequency    = (is_null($frequency))    ? 1    :         PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis        = (is_null($basis))        ? 0    :        PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        //    Validate
        if ((is_numeric($rate)) && (is_numeric($par))) {
            $rate    = (float) $rate;
            $par    = (float) $par;
            if (($rate <= 0) || ($par <= 0)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            $daysBetweenIssueAndSettlement = PHPExcel_Calculation_DateTime::YEARFRAC($issue, $settlement, $basis);
            if (!is_numeric($daysBetweenIssueAndSettlement)) {
                //    return date error
                return $daysBetweenIssueAndSettlement;
            }

            return $par * $rate * $daysBetweenIssueAndSettlement;
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * ACCRINTM
     *
     * Returns the accrued interest for a security that pays interest at maturity.
     *
     * Excel Function:
     *        ACCRINTM(issue,settlement,rate[,par[,basis]])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    issue        The security's issue date.
     * @param    mixed    settlement    The security's settlement (or maturity) date.
     * @param    float    rate        The security's annual coupon rate.
     * @param    float    par            The security's par value.
     *                                    If you omit par, ACCRINT uses $1,000.
     * @param    integer    basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function ACCRINTM($issue, $settlement, $rate, $par = 1000, $basis = 0)
    {
        $issue        = PHPExcel_Calculation_Functions::flattenSingleValue($issue);
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $rate        = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $par        = (is_null($par))    ? 1000 :    PHPExcel_Calculation_Functions::flattenSingleValue($par);
        $basis        = (is_null($basis))    ? 0 :        PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        //    Validate
        if ((is_numeric($rate)) && (is_numeric($par))) {
            $rate    = (float) $rate;
            $par    = (float) $par;
            if (($rate <= 0) || ($par <= 0)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            $daysBetweenIssueAndSettlement = PHPExcel_Calculation_DateTime::YEARFRAC($issue, $settlement, $basis);
            if (!is_numeric($daysBetweenIssueAndSettlement)) {
                //    return date error
                return $daysBetweenIssueAndSettlement;
            }
            return $par * $rate * $daysBetweenIssueAndSettlement;
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * AMORDEGRC
     *
     * Returns the depreciation for each accounting period.
     * This function is provided for the French accounting system. If an asset is purchased in
     * the middle of the accounting period, the prorated depreciation is taken into account.
     * The function is similar to AMORLINC, except that a depreciation coefficient is applied in
     * the calculation depending on the life of the assets.
     * This function will return the depreciation until the last period of the life of the assets
     * or until the cumulated value of depreciation is greater than the cost of the assets minus
     * the salvage value.
     *
     * Excel Function:
     *        AMORDEGRC(cost,purchased,firstPeriod,salvage,period,rate[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    cost        The cost of the asset.
     * @param    mixed    purchased    Date of the purchase of the asset.
     * @param    mixed    firstPeriod    Date of the end of the first period.
     * @param    mixed    salvage        The salvage value at the end of the life of the asset.
     * @param    float    period        The period.
     * @param    float    rate        Rate of depreciation.
     * @param    integer    basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function AMORDEGRC($cost, $purchased, $firstPeriod, $salvage, $period, $rate, $basis = 0)
    {
        $cost            = PHPExcel_Calculation_Functions::flattenSingleValue($cost);
        $purchased        = PHPExcel_Calculation_Functions::flattenSingleValue($purchased);
        $firstPeriod    = PHPExcel_Calculation_Functions::flattenSingleValue($firstPeriod);
        $salvage        = PHPExcel_Calculation_Functions::flattenSingleValue($salvage);
        $period            = floor(PHPExcel_Calculation_Functions::flattenSingleValue($period));
        $rate            = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $basis            = (is_null($basis))    ? 0 :    (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        //    The depreciation coefficients are:
        //    Life of assets (1/rate)        Depreciation coefficient
        //    Less than 3 years            1
        //    Between 3 and 4 years        1.5
        //    Between 5 and 6 years        2
        //    More than 6 years            2.5
        $fUsePer = 1.0 / $rate;
        if ($fUsePer < 3.0) {
            $amortiseCoeff = 1.0;
        } elseif ($fUsePer < 5.0) {
            $amortiseCoeff = 1.5;
        } elseif ($fUsePer <= 6.0) {
            $amortiseCoeff = 2.0;
        } else {
            $amortiseCoeff = 2.5;
        }

        $rate *= $amortiseCoeff;
        $fNRate = round(PHPExcel_Calculation_DateTime::YEARFRAC($purchased, $firstPeriod, $basis) * $rate * $cost, 0);
        $cost -= $fNRate;
        $fRest = $cost - $salvage;

        for ($n = 0; $n < $period; ++$n) {
            $fNRate = round($rate * $cost, 0);
            $fRest -= $fNRate;

            if ($fRest < 0.0) {
                switch ($period - $n) {
                    case 0:
                    case 1:
                        return round($cost * 0.5, 0);
                    default:
                        return 0.0;
                }
            }
            $cost -= $fNRate;
        }
        return $fNRate;
    }


    /**
     * AMORLINC
     *
     * Returns the depreciation for each accounting period.
     * This function is provided for the French accounting system. If an asset is purchased in
     * the middle of the accounting period, the prorated depreciation is taken into account.
     *
     * Excel Function:
     *        AMORLINC(cost,purchased,firstPeriod,salvage,period,rate[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    cost        The cost of the asset.
     * @param    mixed    purchased    Date of the purchase of the asset.
     * @param    mixed    firstPeriod    Date of the end of the first period.
     * @param    mixed    salvage        The salvage value at the end of the life of the asset.
     * @param    float    period        The period.
     * @param    float    rate        Rate of depreciation.
     * @param    integer    basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function AMORLINC($cost, $purchased, $firstPeriod, $salvage, $period, $rate, $basis = 0)
    {
        $cost        = PHPExcel_Calculation_Functions::flattenSingleValue($cost);
        $purchased   = PHPExcel_Calculation_Functions::flattenSingleValue($purchased);
        $firstPeriod = PHPExcel_Calculation_Functions::flattenSingleValue($firstPeriod);
        $salvage     = PHPExcel_Calculation_Functions::flattenSingleValue($salvage);
        $period      = PHPExcel_Calculation_Functions::flattenSingleValue($period);
        $rate        = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $basis       = (is_null($basis)) ? 0 : (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        $fOneRate = $cost * $rate;
        $fCostDelta = $cost - $salvage;
        //    Note, quirky variation for leap years on the YEARFRAC for this function
        $purchasedYear = PHPExcel_Calculation_DateTime::YEAR($purchased);
        $yearFrac = PHPExcel_Calculation_DateTime::YEARFRAC($purchased, $firstPeriod, $basis);

        if (($basis == 1) && ($yearFrac < 1) && (PHPExcel_Calculation_DateTime::isLeapYear($purchasedYear))) {
            $yearFrac *= 365 / 366;
        }

        $f0Rate = $yearFrac * $rate * $cost;
        $nNumOfFullPeriods = intval(($cost - $salvage - $f0Rate) / $fOneRate);

        if ($period == 0) {
            return $f0Rate;
        } elseif ($period <= $nNumOfFullPeriods) {
            return $fOneRate;
        } elseif ($period == ($nNumOfFullPeriods + 1)) {
            return ($fCostDelta - $fOneRate * $nNumOfFullPeriods - $f0Rate);
        } else {
            return 0.0;
        }
    }


    /**
     * COUPDAYBS
     *
     * Returns the number of days from the beginning of the coupon period to the settlement date.
     *
     * Excel Function:
     *        COUPDAYBS(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function COUPDAYBS($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity   = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency  = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis      = (is_null($basis)) ? 0 : (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        $daysPerYear = self::daysPerYear(PHPExcel_Calculation_DateTime::YEAR($settlement), $basis);
        $prev = self::couponFirstPeriodDate($settlement, $maturity, $frequency, false);

        return PHPExcel_Calculation_DateTime::YEARFRAC($prev, $settlement, $basis) * $daysPerYear;
    }


    /**
     * COUPDAYS
     *
     * Returns the number of days in the coupon period that contains the settlement date.
     *
     * Excel Function:
     *        COUPDAYS(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function COUPDAYS($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity   = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency  = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis      = (is_null($basis)) ? 0 : (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        switch ($basis) {
            case 3:
                // Actual/365
                return 365 / $frequency;
            case 1:
                // Actual/actual
                if ($frequency == 1) {
                    $daysPerYear = self::daysPerYear(PHPExcel_Calculation_DateTime::YEAR($maturity), $basis);
                    return ($daysPerYear / $frequency);
                }
                $prev = self::couponFirstPeriodDate($settlement, $maturity, $frequency, false);
                $next = self::couponFirstPeriodDate($settlement, $maturity, $frequency, true);
                return ($next - $prev);
            default:
                // US (NASD) 30/360, Actual/360 or European 30/360
                return 360 / $frequency;
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * COUPDAYSNC
     *
     * Returns the number of days from the settlement date to the next coupon date.
     *
     * Excel Function:
     *        COUPDAYSNC(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function COUPDAYSNC($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity   = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency  = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis      = (is_null($basis)) ? 0 : (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        $daysPerYear = self::daysPerYear(PHPExcel_Calculation_DateTime::YEAR($settlement), $basis);
        $next = self::couponFirstPeriodDate($settlement, $maturity, $frequency, true);

        return PHPExcel_Calculation_DateTime::YEARFRAC($settlement, $next, $basis) * $daysPerYear;
    }


    /**
     * COUPNCD
     *
     * Returns the next coupon date after the settlement date.
     *
     * Excel Function:
     *        COUPNCD(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    mixed    Excel date/time serial value, PHP date/time serial value or PHP date/time object,
     *                        depending on the value of the ReturnDateType flag
     */
    public static function COUPNCD($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity    = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis        = (is_null($basis))    ? 0 :    (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        return self::couponFirstPeriodDate($settlement, $maturity, $frequency, true);
    }


    /**
     * COUPNUM
     *
     * Returns the number of coupons payable between the settlement date and maturity date,
     * rounded up to the nearest whole coupon.
     *
     * Excel Function:
     *        COUPNUM(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    integer
     */
    public static function COUPNUM($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity    = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis        = (is_null($basis))    ? 0 :    (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        $settlement = self::couponFirstPeriodDate($settlement, $maturity, $frequency, true);
        $daysBetweenSettlementAndMaturity = PHPExcel_Calculation_DateTime::YEARFRAC($settlement, $maturity, $basis) * 365;

        switch ($frequency) {
            case 1: // annual payments
                return ceil($daysBetweenSettlementAndMaturity / 360);
            case 2: // half-yearly
                return ceil($daysBetweenSettlementAndMaturity / 180);
            case 4: // quarterly
                return ceil($daysBetweenSettlementAndMaturity / 90);
            case 6: // bimonthly
                return ceil($daysBetweenSettlementAndMaturity / 60);
            case 12: // monthly
                return ceil($daysBetweenSettlementAndMaturity / 30);
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * COUPPCD
     *
     * Returns the previous coupon date before the settlement date.
     *
     * Excel Function:
     *        COUPPCD(settlement,maturity,frequency[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    mixed    frequency    the number of coupon payments per year.
     *                                    Valid frequency values are:
     *                                        1    Annual
     *                                        2    Semi-Annual
     *                                        4    Quarterly
     *                                    If working in Gnumeric Mode, the following frequency options are
     *                                    also available
     *                                        6    Bimonthly
     *                                        12    Monthly
     * @param    integer        basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    mixed    Excel date/time serial value, PHP date/time serial value or PHP date/time object,
     *                        depending on the value of the ReturnDateType flag
     */
    public static function COUPPCD($settlement, $maturity, $frequency, $basis = 0)
    {
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity    = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $frequency    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($frequency);
        $basis        = (is_null($basis))    ? 0 :    (int) PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        if (is_string($settlement = PHPExcel_Calculation_DateTime::getDateValue($settlement))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        if (is_string($maturity = PHPExcel_Calculation_DateTime::getDateValue($maturity))) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        if (($settlement > $maturity) ||
            (!self::isValidFrequency($frequency)) ||
            (($basis < 0) || ($basis > 4))) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        return self::couponFirstPeriodDate($settlement, $maturity, $frequency, false);
    }


    /**
     * CUMIPMT
     *
     * Returns the cumulative interest paid on a loan between the start and end periods.
     *
     * Excel Function:
     *        CUMIPMT(rate,nper,pv,start,end[,type])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $rate    The Interest rate
     * @param    integer    $nper    The total number of payment periods
     * @param    float    $pv        Present Value
     * @param    integer    $start    The first period in the calculation.
     *                            Payment periods are numbered beginning with 1.
     * @param    integer    $end    The last period in the calculation.
     * @param    integer    $type    A number 0 or 1 and indicates when payments are due:
     *                                0 or omitted    At the end of the period.
     *                                1                At the beginning of the period.
     * @return    float
     */
    public static function CUMIPMT($rate, $nper, $pv, $start, $end, $type = 0)
    {
        $rate    = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $nper    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($nper);
        $pv        = PHPExcel_Calculation_Functions::flattenSingleValue($pv);
        $start    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($start);
        $end    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($end);
        $type    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($type);

        // Validate parameters
        if ($type != 0 && $type != 1) {
            return PHPExcel_Calculation_Functions::NaN();
        }
        if ($start < 1 || $start > $end) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        // Calculate
        $interest = 0;
        for ($per = $start; $per <= $end; ++$per) {
            $interest += self::IPMT($rate, $per, $nper, $pv, 0, $type);
        }

        return $interest;
    }


    /**
     * CUMPRINC
     *
     * Returns the cumulative principal paid on a loan between the start and end periods.
     *
     * Excel Function:
     *        CUMPRINC(rate,nper,pv,start,end[,type])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $rate    The Interest rate
     * @param    integer    $nper    The total number of payment periods
     * @param    float    $pv        Present Value
     * @param    integer    $start    The first period in the calculation.
     *                            Payment periods are numbered beginning with 1.
     * @param    integer    $end    The last period in the calculation.
     * @param    integer    $type    A number 0 or 1 and indicates when payments are due:
     *                                0 or omitted    At the end of the period.
     *                                1                At the beginning of the period.
     * @return    float
     */
    public static function CUMPRINC($rate, $nper, $pv, $start, $end, $type = 0)
    {
        $rate    = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $nper    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($nper);
        $pv        = PHPExcel_Calculation_Functions::flattenSingleValue($pv);
        $start    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($start);
        $end    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($end);
        $type    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($type);

        // Validate parameters
        if ($type != 0 && $type != 1) {
            return PHPExcel_Calculation_Functions::NaN();
        }
        if ($start < 1 || $start > $end) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        // Calculate
        $principal = 0;
        for ($per = $start; $per <= $end; ++$per) {
            $principal += self::PPMT($rate, $per, $nper, $pv, 0, $type);
        }

        return $principal;
    }


    /**
     * DB
     *
     * Returns the depreciation of an asset for a specified period using the
     * fixed-declining balance method.
     * This form of depreciation is used if you want to get a higher depreciation value
     * at the beginning of the depreciation (as opposed to linear depreciation). The
     * depreciation value is reduced with every depreciation period by the depreciation
     * already deducted from the initial cost.
     *
     * Excel Function:
     *        DB(cost,salvage,life,period[,month])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    cost        Initial cost of the asset.
     * @param    float    salvage        Value at the end of the depreciation.
     *                                (Sometimes called the salvage value of the asset)
     * @param    integer    life        Number of periods over which the asset is depreciated.
     *                                (Sometimes called the useful life of the asset)
     * @param    integer    period        The period for which you want to calculate the
     *                                depreciation. Period must use the same units as life.
     * @param    integer    month        Number of months in the first year. If month is omitted,
     *                                it defaults to 12.
     * @return    float
     */
    public static function DB($cost, $salvage, $life, $period, $month = 12)
    {
        $cost        = PHPExcel_Calculation_Functions::flattenSingleValue($cost);
        $salvage    = PHPExcel_Calculation_Functions::flattenSingleValue($salvage);
        $life        = PHPExcel_Calculation_Functions::flattenSingleValue($life);
        $period        = PHPExcel_Calculation_Functions::flattenSingleValue($period);
        $month        = PHPExcel_Calculation_Functions::flattenSingleValue($month);

        //    Validate
        if ((is_numeric($cost)) && (is_numeric($salvage)) && (is_numeric($life)) && (is_numeric($period)) && (is_numeric($month))) {
            $cost    = (float) $cost;
            $salvage = (float) $salvage;
            $life    = (int) $life;
            $period  = (int) $period;
            $month   = (int) $month;
            if ($cost == 0) {
                return 0.0;
            } elseif (($cost < 0) || (($salvage / $cost) < 0) || ($life <= 0) || ($period < 1) || ($month < 1)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            //    Set Fixed Depreciation Rate
            $fixedDepreciationRate = 1 - pow(($salvage / $cost), (1 / $life));
            $fixedDepreciationRate = round($fixedDepreciationRate, 3);

            //    Loop through each period calculating the depreciation
            $previousDepreciation = 0;
            for ($per = 1; $per <= $period; ++$per) {
                if ($per == 1) {
                    $depreciation = $cost * $fixedDepreciationRate * $month / 12;
                } elseif ($per == ($life + 1)) {
                    $depreciation = ($cost - $previousDepreciation) * $fixedDepreciationRate * (12 - $month) / 12;
                } else {
                    $depreciation = ($cost - $previousDepreciation) * $fixedDepreciationRate;
                }
                $previousDepreciation += $depreciation;
            }
            if (PHPExcel_Calculation_Functions::getCompatibilityMode() == PHPExcel_Calculation_Functions::COMPATIBILITY_GNUMERIC) {
                $depreciation = round($depreciation, 2);
            }
            return $depreciation;
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * DDB
     *
     * Returns the depreciation of an asset for a specified period using the
     * double-declining balance method or some other method you specify.
     *
     * Excel Function:
     *        DDB(cost,salvage,life,period[,factor])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    cost        Initial cost of the asset.
     * @param    float    salvage        Value at the end of the depreciation.
     *                                (Sometimes called the salvage value of the asset)
     * @param    integer    life        Number of periods over which the asset is depreciated.
     *                                (Sometimes called the useful life of the asset)
     * @param    integer    period        The period for which you want to calculate the
     *                                depreciation. Period must use the same units as life.
     * @param    float    factor        The rate at which the balance declines.
     *                                If factor is omitted, it is assumed to be 2 (the
     *                                double-declining balance method).
     * @return    float
     */
    public static function DDB($cost, $salvage, $life, $period, $factor = 2.0)
    {
        $cost        = PHPExcel_Calculation_Functions::flattenSingleValue($cost);
        $salvage    = PHPExcel_Calculation_Functions::flattenSingleValue($salvage);
        $life        = PHPExcel_Calculation_Functions::flattenSingleValue($life);
        $period        = PHPExcel_Calculation_Functions::flattenSingleValue($period);
        $factor        = PHPExcel_Calculation_Functions::flattenSingleValue($factor);

        //    Validate
        if ((is_numeric($cost)) && (is_numeric($salvage)) && (is_numeric($life)) && (is_numeric($period)) && (is_numeric($factor))) {
            $cost    = (float) $cost;
            $salvage = (float) $salvage;
            $life    = (int) $life;
            $period  = (int) $period;
            $factor  = (float) $factor;
            if (($cost <= 0) || (($salvage / $cost) < 0) || ($life <= 0) || ($period < 1) || ($factor <= 0.0) || ($period > $life)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            //    Set Fixed Depreciation Rate
            $fixedDepreciationRate = 1 - pow(($salvage / $cost), (1 / $life));
            $fixedDepreciationRate = round($fixedDepreciationRate, 3);

            //    Loop through each period calculating the depreciation
            $previousDepreciation = 0;
            for ($per = 1; $per <= $period; ++$per) {
                $depreciation = min(($cost - $previousDepreciation) * ($factor / $life), ($cost - $salvage - $previousDepreciation));
                $previousDepreciation += $depreciation;
            }
            if (PHPExcel_Calculation_Functions::getCompatibilityMode() == PHPExcel_Calculation_Functions::COMPATIBILITY_GNUMERIC) {
                $depreciation = round($depreciation, 2);
            }
            return $depreciation;
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * DISC
     *
     * Returns the discount rate for a security.
     *
     * Excel Function:
     *        DISC(settlement,maturity,price,redemption[,basis])
     *
     * @access    public
     * @category Financial Functions
     * @param    mixed    settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue
     *                                date when the security is traded to the buyer.
     * @param    mixed    maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    integer    price        The security's price per $100 face value.
     * @param    integer    redemption    The security's redemption value per $100 face value.
     * @param    integer    basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function DISC($settlement, $maturity, $price, $redemption, $basis = 0)
    {
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity    = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $price        = PHPExcel_Calculation_Functions::flattenSingleValue($price);
        $redemption    = PHPExcel_Calculation_Functions::flattenSingleValue($redemption);
        $basis        = PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        //    Validate
        if ((is_numeric($price)) && (is_numeric($redemption)) && (is_numeric($basis))) {
            $price        = (float) $price;
            $redemption    = (float) $redemption;
            $basis        = (int) $basis;
            if (($price <= 0) || ($redemption <= 0)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            $daysBetweenSettlementAndMaturity = PHPExcel_Calculation_DateTime::YEARFRAC($settlement, $maturity, $basis);
            if (!is_numeric($daysBetweenSettlementAndMaturity)) {
                //    return date error
                return $daysBetweenSettlementAndMaturity;
            }

            return ((1 - $price / $redemption) / $daysBetweenSettlementAndMaturity);
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * DOLLARDE
     *
     * Converts a dollar price expressed as an integer part and a fraction
     *        part into a dollar price expressed as a decimal number.
     * Fractional dollar numbers are sometimes used for security prices.
     *
     * Excel Function:
     *        DOLLARDE(fractional_dollar,fraction)
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $fractional_dollar    Fractional Dollar
     * @param    integer    $fraction            Fraction
     * @return    float
     */
    public static function DOLLARDE($fractional_dollar = null, $fraction = 0)
    {
        $fractional_dollar    = PHPExcel_Calculation_Functions::flattenSingleValue($fractional_dollar);
        $fraction            = (int)PHPExcel_Calculation_Functions::flattenSingleValue($fraction);

        // Validate parameters
        if (is_null($fractional_dollar) || $fraction < 0) {
            return PHPExcel_Calculation_Functions::NaN();
        }
        if ($fraction == 0) {
            return PHPExcel_Calculation_Functions::DIV0();
        }

        $dollars = floor($fractional_dollar);
        $cents = fmod($fractional_dollar, 1);
        $cents /= $fraction;
        $cents *= pow(10, ceil(log10($fraction)));
        return $dollars + $cents;
    }


    /**
     * DOLLARFR
     *
     * Converts a dollar price expressed as a decimal number into a dollar price
     *        expressed as a fraction.
     * Fractional dollar numbers are sometimes used for security prices.
     *
     * Excel Function:
     *        DOLLARFR(decimal_dollar,fraction)
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $decimal_dollar        Decimal Dollar
     * @param    integer    $fraction            Fraction
     * @return    float
     */
    public static function DOLLARFR($decimal_dollar = null, $fraction = 0)
    {
        $decimal_dollar    = PHPExcel_Calculation_Functions::flattenSingleValue($decimal_dollar);
        $fraction        = (int)PHPExcel_Calculation_Functions::flattenSingleValue($fraction);

        // Validate parameters
        if (is_null($decimal_dollar) || $fraction < 0) {
            return PHPExcel_Calculation_Functions::NaN();
        }
        if ($fraction == 0) {
            return PHPExcel_Calculation_Functions::DIV0();
        }

        $dollars = floor($decimal_dollar);
        $cents = fmod($decimal_dollar, 1);
        $cents *= $fraction;
        $cents *= pow(10, -ceil(log10($fraction)));
        return $dollars + $cents;
    }


    /**
     * EFFECT
     *
     * Returns the effective interest rate given the nominal rate and the number of
     *        compounding payments per year.
     *
     * Excel Function:
     *        EFFECT(nominal_rate,npery)
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $nominal_rate        Nominal interest rate
     * @param    integer    $npery                Number of compounding payments per year
     * @return    float
     */
    public static function EFFECT($nominal_rate = 0, $npery = 0)
    {
        $nominal_rate    = PHPExcel_Calculation_Functions::flattenSingleValue($nominal_rate);
        $npery            = (int)PHPExcel_Calculation_Functions::flattenSingleValue($npery);

        // Validate parameters
        if ($nominal_rate <= 0 || $npery < 1) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        return pow((1 + $nominal_rate / $npery), $npery) - 1;
    }


    /**
     * FV
     *
     * Returns the Future Value of a cash flow with constant payments and interest rate (annuities).
     *
     * Excel Function:
     *        FV(rate,nper,pmt[,pv[,type]])
     *
     * @access    public
     * @category Financial Functions
     * @param    float    $rate    The interest rate per period
     * @param    int        $nper    Total number of payment periods in an annuity
     * @param    float    $pmt    The payment made each period: it cannot change over the
     *                            life of the annuity. Typically, pmt contains principal
     *                            and interest but no other fees or taxes.
     * @param    float    $pv        Present Value, or the lump-sum amount that a series of
     *                            future payments is worth right now.
     * @param    integer    $type    A number 0 or 1 and indicates when payments are due:
     *                                0 or omitted    At the end of the period.
     *                                1                At the beginning of the period.
     * @return    float
     */
    public static function FV($rate = 0, $nper = 0, $pmt = 0, $pv = 0, $type = 0)
    {
        $rate    = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $nper    = PHPExcel_Calculation_Functions::flattenSingleValue($nper);
        $pmt    = PHPExcel_Calculation_Functions::flattenSingleValue($pmt);
        $pv        = PHPExcel_Calculation_Functions::flattenSingleValue($pv);
        $type    = PHPExcel_Calculation_Functions::flattenSingleValue($type);

        // Validate parameters
        if ($type != 0 && $type != 1) {
            return PHPExcel_Calculation_Functions::NaN();
        }

        // Calculate
        if (!is_null($rate) && $rate != 0) {
            return -$pv * pow(1 + $rate, $nper) - $pmt * (1 + $rate * $type) * (pow(1 + $rate, $nper) - 1) / $rate;
        }
        return -$pv - $pmt * $nper;
    }


    /**
     * FVSCHEDULE
     *
     * Returns the future value of an initial principal after applying a series of compound interest rates.
     * Use FVSCHEDULE to calculate the future value of an investment with a variable or adjustable rate.
     *
     * Excel Function:
     *        FVSCHEDULE(principal,schedule)
     *
     * @param    float    $principal    The present value.
     * @param    float[]    $schedule    An array of interest rates to apply.
     * @return    float
     */
    public static function FVSCHEDULE($principal, $schedule)
    {
        $principal    = PHPExcel_Calculation_Functions::flattenSingleValue($principal);
        $schedule    = PHPExcel_Calculation_Functions::flattenArray($schedule);

        foreach ($schedule as $rate) {
            $principal *= 1 + $rate;
        }

        return $principal;
    }


    /**
     * INTRATE
     *
     * Returns the interest rate for a fully invested security.
     *
     * Excel Function:
     *        INTRATE(settlement,maturity,investment,redemption[,basis])
     *
     * @param    mixed    $settlement    The security's settlement date.
     *                                The security settlement date is the date after the issue date when the security is traded to the buyer.
     * @param    mixed    $maturity    The security's maturity date.
     *                                The maturity date is the date when the security expires.
     * @param    integer    $investment    The amount invested in the security.
     * @param    integer    $redemption    The amount to be received at maturity.
     * @param    integer    $basis        The type of day count to use.
     *                                        0 or omitted    US (NASD) 30/360
     *                                        1                Actual/actual
     *                                        2                Actual/360
     *                                        3                Actual/365
     *                                        4                European 30/360
     * @return    float
     */
    public static function INTRATE($settlement, $maturity, $investment, $redemption, $basis = 0)
    {
        $settlement    = PHPExcel_Calculation_Functions::flattenSingleValue($settlement);
        $maturity    = PHPExcel_Calculation_Functions::flattenSingleValue($maturity);
        $investment    = PHPExcel_Calculation_Functions::flattenSingleValue($investment);
        $redemption    = PHPExcel_Calculation_Functions::flattenSingleValue($redemption);
        $basis        = PHPExcel_Calculation_Functions::flattenSingleValue($basis);

        //    Validate
        if ((is_numeric($investment)) && (is_numeric($redemption)) && (is_numeric($basis))) {
            $investment    = (float) $investment;
            $redemption    = (float) $redemption;
            $basis        = (int) $basis;
            if (($investment <= 0) || ($redemption <= 0)) {
                return PHPExcel_Calculation_Functions::NaN();
            }
            $daysBetweenSettlementAndMaturity = PHPExcel_Calculation_DateTime::YEARFRAC($settlement, $maturity, $basis);
            if (!is_numeric($daysBetweenSettlementAndMaturity)) {
                //    return date error
                return $daysBetweenSettlementAndMaturity;
            }

            return (($redemption / $investment) - 1) / ($daysBetweenSettlementAndMaturity);
        }
        return PHPExcel_Calculation_Functions::VALUE();
    }


    /**
     * IPMT
     *
     * Returns the interest payment for a given period for an investment based on periodic, constant payments and a constant interest rate.
     *
     * Excel Function:
     *        IPMT(rate,per,nper,pv[,fv][,type])
     *
     * @param    float    $rate    Interest rate per period
     * @param    int        $per    Period for which we want to find the interest
     * @param    int        $nper    Number of periods
     * @param    float    $pv        Present Value
     * @param    float    $fv        Future Value
     * @param    int        $type    Payment type: 0 = at the end of each period, 1 = at the beginning of each period
     * @return    float
     */
    public static function IPMT($rate, $per, $nper, $pv, $fv = 0, $type = 0)
    {
        $rate    = PHPExcel_Calculation_Functions::flattenSingleValue($rate);
        $per    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($per);
        $nper    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($nper);
        $pv        = PHPExcel_Calculation_Functions::flattenSingleValue($pv);
        $fv        = PHPExcel_Calculation_Functions::flattenSingleValue($fv);
        $type    = (int) PHPExcel_Calculation_Functions::flattenSingleValue($type);

        // Validate parameters
        if ($type != 0 && $type != 1) {
            return PHPExcel_Calculation_Functions::NaN();
        }
        if ($per <= 0 || $per > $nper) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        // Calculate
        $interestAndPrincipal = self::interestAndPrincipal($rate, $per, $nper, $pv, $fv, $type);
        return $interestAndPrincipal[0];
    }

    /**
     * IRR
     *
     * Returns the internal rate of return for a series of cash flows represented by the numbers in values.
     * These cash flows do not have to be even, as they would be for an annuity. However, the cash flows must occur
     * at regular intervals, such as monthly or annually. The internal rate of return is the interest rate received
     * for an investment consisting of payments (negative values) and income (positive values) that occur at regular
     * periods.
     *
     * Excel Function:
     *        IRR(values[,guess])
     *
     * @param    float[]    $values        An array or a reference to cells that contain numbers for which you want
     *                                    to calculate the internal rate of return.
     *                                Values must contain at least one positive value and one negative value to
     *                                    calculate the internal rate of return.
     * @param    float    $guess        A number that you guess is close to the result of IRR
     * @return    float
     */
    public static function IRR($values, $guess = 0.1)
    {
        if (!is_array($values)) {
            return PHPExcel_Calculation_Functions::VALUE();
        }
        $values = PHPExcel_Calculation_Functions::flattenArray($values);
        $guess = PHPExcel_Calculation_Functions::flattenSingleValue($guess);

        // create an initial range, with a root somewhere between 0 and guess
        $x1 = 0.0;
        $x2 = $guess;
        $f1 = self::NPV($x1, $values);
        $f2 = self::NPV($x2, $values);
        for ($i = 0; $i < FINANCIAL_MAX_ITERATIONS; ++$i) {
            if (($f1 * $f2) < 0.0) {
                break;
            }
            if (abs($f1) < abs($f2)) {
                $f1 = self::NPV($x1 += 1.6 * ($x1 - $x2), $values);
            } else {
                $f2 = self::NPV($x2 += 1.6 * ($x2 - $x1), $values);
            }
        }
        if (($f1 * $f2) > 0.0) {
            return PHPExcel_Calculation_Functions::VALUE();
        }

        $f = self::NPV($x1, $values);
        if ($f < 0.0) {
            $rtb = $x1;
            $dx = $x2 - $x1;
        } else {
            $rtb = $x2;
            $dx = $x1 - $x2;
        }

        for ($i = 0; $i < FINANCIAL_MAX_ITERATIONS; ++$i) {
            $dx *= 0.5;
            $x_mid = $rtb + $dx;
            $f_mid = self::NPV($x_mid, $values);
            if ($f_mid <= 0.