import {Component, Input, OnInit} from '@angular/core';
import {
  NbGetters, NbSortDirection, NbSortRequest,
  NbTreeGridDataSource, NbTreeGridDataSourceBuilder,
} from '@nebular/theme';
import {TaxonomyVirusService} from '../../../services/taxonomy-virus.service';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';


export interface TaxonomyVirusInterface {
  idtaxonomy?: string;
  commonname?: any;
  family?: string;
  genre?: string;
  species?: string;
  subspecies?: string;
  ncbitax?: string;
  children?: ChildrenFP[];
  expanded?: boolean;
  actions?: any;
  page?: any;
}

interface ChildrenFP {
  idtaxonomy?: string;
  actions?: any;
  page?: any;
}


@Component({
  selector: 'ngx-taxonomy-virus-list-tree-grid',
  templateUrl: './taxonomy-virus-list-tree-grid.component.html',
  styleUrls: ['./taxonomy-virus-list-tree-grid.component.scss'],
})
export class TaxonomyVirusListTreeGridComponent implements OnInit {

  customColumn = 'idtaxonomy';
  defaultColumns = ['commonname', 'family', 'genre', 'species',
    'subspecies', 'ncbitax'];
  allColumns = [this.customColumn, ...this.defaultColumns];

  current_page = 1;
  count_entries: number;
  n_pags: number;
  idTax: string;
  search: boolean;
  search_term: string = '';
  data_aux = [] as any;
  data_all = [] as any;
  aux_inter: TaxonomyVirusInterface = {};
  search_form = new FormControl('');
  addVirusForm: FormGroup;
  putVirusForm: FormGroup;
  dataSource: NbTreeGridDataSource<TaxonomyVirusInterface>;

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  add_form: boolean = false;
  put_form: boolean = false;

  fileUrl;
  data_print;

  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<TaxonomyVirusInterface>,
              private taxonomyvirusService: TaxonomyVirusService,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private sanitizer: DomSanitizer,
  ) {
  }

  ngOnInit() {
    this.fetchTaxonomy();
    this.addVirusForm = this.formBuilder.group({
      idtaxonomy: new FormControl('', [
        Validators.required,
      ]),
      commonname: new FormControl('', [
        Validators.required,
      ]),
      family: new FormControl(),
      genre: new FormControl(),
      species: new FormControl(),
      subspecies: new FormControl(),
      ncbitax: new FormControl(),
    });
    this.addVirusForm.patchValue({
      idtaxonomy: '1',
    });
    this.putVirusForm = this.formBuilder.group({
      idtaxonomy: new FormControl('', [
        Validators.required,
      ]),
      commonname: new FormControl('', [
        Validators.required,
      ]),
      family: new FormControl(),
      genre: new FormControl(),
      species: new FormControl(),
      subspecies: new FormControl(),
      ncbitax: new FormControl(),
    });
  }

  fetchTaxonomy() {
    this.search = false;
    this.idTax = this.route.snapshot.queryParamMap.get('idtax');
    if (this.route.snapshot.queryParamMap.get('search')) {
      this.search_form = new FormControl(this.route.snapshot.queryParamMap.get('search'));
    }
    if (this.idTax !== null) {
      this.search = true;
      this.search_term = this.idTax;
    }
    this.taxonomyvirusService.getPage(this.current_page, this.search_form.value,
      this.search, this.search_term).subscribe(
      (data: Array<object>) => {
        const getters: NbGetters<TaxonomyVirusInterface, TaxonomyVirusInterface> = {
          dataGetter: (node: TaxonomyVirusInterface) => node,
          childrenGetter: (node: TaxonomyVirusInterface) => node.children || undefined,
          expandedGetter: (node: TaxonomyVirusInterface) => !!node.expanded,
        };
        this.data_aux = [];
        for (let i = 0; i < data['results'].length; i++) {
          const aux = data['results'][i];
          this.aux_inter = aux;
          this.aux_inter.actions = null;
          this.idTax = String(aux['idtaxonomy']);
          this.aux_inter.children = [
            {
              idtaxonomy: '', actions: new URL(
                'http://localhost:4201/pages/tables/protein?idtax=' +
                String(this.idTax)), page: 'Fusion Protein',
            },
            {
              idtaxonomy: '', actions: new URL(
                'http://localhost:4201/pages/tables/fusion-peptide?idtax='
                + String(this.idTax)), page: 'Fusion Peptide',
            },
            {
              idtaxonomy: '', actions: new URL(
                'http://localhost:4201/pages/tables/tax-host?idtax='
                + String(this.idTax)), page: 'Hosts',
            },
          ];
          this.aux_inter.expanded = false;
          this.data_aux.push(this.aux_inter);
        }
        this.dataSource = this.dataSourceBuilder.create(this.data_aux, getters);
        this.count_entries = data['count'];
        this.n_pags = Math.round(this.count_entries / 10) + 1;
      });

    this.saveDataFile();

  }

  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }

  // function fetches the next paginated items by using the url in the next property
  fetchNext() {
    if (this.current_page < this.n_pags) {
      this.current_page = this.current_page + 1;
    }
    this.fetchTaxonomy();
  }

  // function fetches the previous paginated items by using the url in the previous property
  fetchPrevious() {
    if (this.current_page > 1) {
      this.current_page = this.current_page - 1;
    }
    this.fetchTaxonomy();
  }

  // function fetches the first paginated items by using the url in the next property
  fetchFirst() {
    this.current_page = 1;
    this.fetchTaxonomy();
  }

  // function fetches the last paginated items by using the url in the previous property
  fetchLast() {
    this.current_page = this.n_pags;
    this.fetchTaxonomy();
  }

  searchTableResult() {
    if (!this.route.snapshot.queryParamMap.get('search') &&
      !this.route.snapshot.queryParamMap.get('idtax')) {
      this.current_page = 1;
      this.fetchTaxonomy();
    } else {
      window.open('http://localhost:4201/pages/tables/taxonomy-virus?search='
        + this.search_form.value, '_self');
    }
  }

  goToUrl(newUrl, add = false): void {
    if (add === false) {
      if (newUrl !== null) {
        window.open(newUrl, '_blank');
      }
    } else {
      window.open('http://localhost:8000/admin/crmapp/taxonomyvirus/',
        '_blank');
    }
  }

  verifyNull(data) {
    return data === null;
  }

  onSubmit(put: boolean = false) {
    if (!put) {
      if (this.addVirusForm.valid) {
        // this.taxonomyvirusService.add(this.addVirusForm as TaxonomyVirusInterface);
        this.taxonomyvirusService.add(this.addVirusForm.value)
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      } else {
        alert('Required at least Name Parameter');
      }
    } else {
      if (this.putVirusForm.valid) {
        // this.taxonomyvirusService.add(this.addVirusForm as TaxonomyVirusInterface);
        this.taxonomyvirusService.put(this.putVirusForm.value, this.putVirusForm.value['idtaxonomy'])
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      } else {
        alert('Required at least Name Parameter');
      }
    }
  }

  saveDataFile() {
    /**
     window.open('http://localhost:8000/taxonomyvirus/save/?search=' +  this.search_form.value,
     '_blank');
     */
    this.data_all = [] as any;
    let data_to_print = 'idtaxonomy,commonname,family,genre,species,subspecies,ncbitax\n';
    let taxonomy = '';
    if (this.idTax !== null) {
      taxonomy = this.idTax;
    }
    this.taxonomyvirusService.receive_all(this.search_form.value, taxonomy).subscribe(
      (data: Array<object>) => {
        this.data_all = data;

        for (const i of this.data_all) {
          data_to_print = data_to_print + i['idtaxonomy'] + ',' + i['commonname'] + ',' + i['family'] + ','
            + i['genre'] + ',' + i['species'] + ',' + i['subspecies'] + ',' + i['ncbitax'] + '\n';
        }

        this.keepData(data_to_print);
        
        /**
        const data_send = {data: data_print};
        this.taxonomyvirusService.send(data_send).subscribe(
          (data_) => {
            alert(data_['response']);
          },
          (error: HttpErrorResponse) => {
            alert(error.message);
          },
        );
            */
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      },
    );
  }

  addDataForm() {
    this.add_form = true;
    this.put_form = false;
  }

  putDataForm() {
    this.put_form = true;
    this.add_form = false;
  }

  keepData(data: string) {
    this.data_print = data;

    const blob = new Blob([this.data_print], { type: 'text/csv' });

    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));

  }
}
