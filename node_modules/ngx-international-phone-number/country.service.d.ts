import { Country } from './country.model';
export declare class CountryService {
    private countries;
    constructor();
    /**
     * Returns the countries
     */
    getCountries(): Country[];
    /**
     * Returns the countries by iso code
     */
    getCountriesByISO(listOfIso: any): Country[];
    /**
     * Load and returns the countries
     */
    private loadCountries;
}
