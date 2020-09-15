import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {
  NbGetters, NbSortDirection, NbSortRequest,
  NbTreeGridDataSource, NbTreeGridDataSourceBuilder
} from '@nebular/theme';
import {ProteinService} from '../../../services/protein.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';


interface ProteinInterface {
  idprotein?: string;
  name?: string;
  class_field?: string;
  activation?: string;
  name_fusogenic_unit?: string;
  location_fusogenic?: string;
  sequence_fusogenic?: string;
  uniprotid?: object;
  ncbiid?: string;
  idtaxonomy?: object;
  virus?: string;
  children?: ChildrenFP[];
  expanded?: boolean;
  actions?: any;
  page?: any;
}

interface ChildrenFP {
  idprotein?: string;
  actions?: any;
  page?: any;
}


@Component({
  selector: 'ngx-protein-list-tree-grid',
  templateUrl: './protein-list-tree-grid.component.html',
  styleUrls: ['./protein-list-tree-grid.component.scss'],
})
export class ProteinListTreeGridComponent implements OnInit {

  customColumn = 'idprotein';
  defaultColumns = ['name', 'class_field', 'activation', 'name_fusogenic_unit', 'location_fusogenic',
    'sequence_fusogenic', 'uniprotid', 'ncbiid', 'idtaxonomy', 'virus'];
  allColumns = [this.customColumn, ...this.defaultColumns];

  current_page = 1;

  count_entries: number;
  n_pags: number;

  search: string = '';
  search_term: string;
  data_aux = [] as any;
  data_all = [] as any;
  idTax: string;
  idProt: string;
  addProteinForm: FormGroup;
  putProteinForm: FormGroup;
  search_form = new FormControl('');

  aux_inter: ProteinInterface = {};
  dataSource: NbTreeGridDataSource<ProteinInterface>;

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;
  protParam: string;
  taxParam: string;
  search_tools: string = '';

  add_form: boolean = false;
  put_form: boolean = false;

  fileUrl;
  data_print;


  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<ProteinInterface>,
              private proteinService: ProteinService,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private sanitizer: DomSanitizer,
              ) {
  }

  ngOnInit() {
    this.fetchProtein();

    this.addProteinForm = this.formBuilder.group({
      idprotein: new FormControl('', [
        Validators.required,
      ]),
      name: new FormControl('', [
        Validators.required,
      ]),
      class_field: new FormControl(),
      activation: new FormControl(),
      name_fusogenic_unit: new FormControl(),
      location_fusogenic: new FormControl(),
      sequence_fusogenic: new FormControl(),
      uniprotid: new FormControl(),
      ncbiid: new FormControl(),
      idtaxonomy: new FormControl(),
    });
    this.addProteinForm.patchValue({
      idprotein: '1',
    });
    this.putProteinForm = this.formBuilder.group({
      idprotein: new FormControl('', [
        Validators.required,
      ]),
      name: new FormControl('', [
        Validators.required,
      ]),
      class_field: new FormControl(),
      activation: new FormControl(),
      name_fusogenic_unit: new FormControl(),
      location_fusogenic: new FormControl(),
      sequence_fusogenic: new FormControl(),
      uniprotid: new FormControl(),
      ncbiid: new FormControl(),
      idtaxonomy: new FormControl(),
    });

  }

  fetchProtein() {
    this.protParam = this.route.snapshot.queryParamMap.get('idprot');
    this.taxParam = this.route.snapshot.queryParamMap.get('idtax');
    if (this.route.snapshot.queryParamMap.get('search')) {
      this.search_form = new FormControl(this.route.snapshot.queryParamMap.get('search'));
    }
    if (this.protParam !== null) {
      this.search = 'Prot';
      this.search_term = this.protParam;
    }
    // tslint:disable-next-line:one-line
    else if (this.taxParam !== null) {
      this.search = 'Tax';
      this.search_term = this.taxParam;
    }
    this.proteinService.getPage(this.current_page, this.search,
      this.search_form.value, this.search_term).subscribe((data: Array<object>) => {
      const getters: NbGetters<ProteinInterface, ProteinInterface> = {
        dataGetter: (node: ProteinInterface) => node,
        childrenGetter: (node: ProteinInterface) => node.children || undefined,
        expandedGetter: (node: ProteinInterface) => !!node.expanded,
      };
      this.data_aux = [];
      for (let i = 0; i < data['results'].length; i++) {
        const aux = data['results'][i];
        this.idProt = String(aux['idprotein']);
        this.idTax = String(aux['idtaxonomy']);
        this.aux_inter.actions = null;
        this.aux_inter = aux;
        this.aux_inter.children = [
          {
            idprotein: '', actions: new URL(
              'http://localhost:4201/pages/tables/fusion-peptide?idprot=' + String(this.idProt)),
            page: 'Fusion Peptide'
          },
          {
            idprotein: '', actions: new URL(
              'http://localhost:4201/pages/tables/taxonomy-virus?idtax=' + String(this.idTax)),
            page: 'Virus'
          },
          {
            idprotein: '', actions: new URL(
              'http://localhost:4201/pages/tables/protein-references?idprot=' + String(this.idProt)),
            page: 'References'
          },
          {
            idprotein: '', actions: new URL(
              'http://localhost:4201/pages/tables/inhibitor-antibody?idprot=' + String(this.idProt)),
            page: 'Inhibitors / Antibodies'
          },
        ];
        this.aux_inter.expanded = false;
        this.data_aux.push(this.aux_inter);
      }

      // this.dataSource = this.dataSourceBuilder.create(data['results'], getters);
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
    this.fetchProtein();
  }

  // function fetches the previous paginated items by using the url in the previous property
  fetchPrevious() {
    if (this.current_page > 1) {
      this.current_page = this.current_page - 1;
    }
    this.fetchProtein();
  }

  // function fetches the first paginated items by using the url in the next property
  fetchFirst() {
    this.current_page = 1;
    this.fetchProtein();
  }

  // function fetches the last paginated items by using the url in the previous property
  fetchLast() {
    this.current_page = this.n_pags;
    this.fetchProtein();
  }

  searchTableResult() {
    if (!this.route.snapshot.queryParamMap.get('search') && !this.route.snapshot.queryParamMap.get('idprot') &&
      !this.route.snapshot.queryParamMap.get('idtax')) {
      this.current_page = 1;
      this.fetchProtein();
    } else {
      window.open('http://localhost:4201/pages/tables/protein?search='
        + this.search_form.value, '_self');
    }
  }

  goToUrl(newUrl, add = false): void {
    if (add === false) {
      if (newUrl !== null) {
        window.open(newUrl, '_blank');
      }
    }
    // tslint:disable-next-line:one-line
    else {
      window.open('http://localhost:8000/admin/crmapp/protein/',
        '_blank');
    }
  }

  onSubmit(put: boolean = false) {
    if (!put) {
      if (this.addProteinForm.valid) {
        // alert(JSON.stringify(this.addProteinForm.value));
        // this.taxonomyvirusService.add(this.addVirusForm as TaxonomyVirusInterface);
        this.proteinService.add(this.addProteinForm.value)
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required at least Name Parameter');
      }
    } else {
      if (this.putProteinForm.valid) {
        // alert(JSON.stringify(this.addProteinForm.value));
        // this.taxonomyvirusService.add(this.addVirusForm as TaxonomyVirusInterface);
        this.proteinService.put(this.putProteinForm.value, this.putProteinForm.value['idprotein'])
          .subscribe(
            (data) => {
              alert('Form submitted successfully');
            },
            (error: HttpErrorResponse) => {
              alert(error.message);
            });
      }
      // tslint:disable-next-line:one-line
      else {
        alert('Required at least Name Parameter');
      }
    }
  }

  seq_tools(checked: boolean, id: string, seq: string) {
    if (checked) {
      if (!this.search_tools.includes('>' + String(id) + '\n' + seq + '\n')) {
        this.search_tools = this.search_tools + '>' + String(id) + '\n' + seq + '\n';
      }
    } else {
      this.search_tools = this.search_tools.replace('>' + String(id) + '\n' + seq + '\n', '');
    }
  }

  goToTools(type: string) {
    if (type === 'BLAST') {
      if ((this.search_tools.match(/>/g) || []).length > 0) {
        window.open('http://localhost:4201/pages/tools/blast?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT AT LEAST 1 SEQUENCE');
      }
    } else if (type === 'CLUSTAL') {
      if ((this.search_tools.match(/>/g) || []).length > 2) {
        window.open('http://localhost:4201/pages/tools/clustal?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT AT LEAST 3 SEQUENCES');
      }
    } else if (type === 'IEDB') {
      if ((this.search_tools.match(/>/g) || []).length === 1) {
        window.open('http://localhost:4201/pages/tools/epitopes?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT 1 SEQUENCE');
      }
    } else if (type === 'HMMER') {
      if ((this.search_tools.match(/>/g) || []).length === 1) {
        // const search_tools_hmmer = this.search_tools.replace('>' + String(id) + '\n', '');
        window.open('http://localhost:4201/pages/tools/hmmer?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT 1 SEQUENCE');
      }
    } else if (type === 'WEBLOGO') {
      if ((this.search_tools.match(/>/g) || []).length > 1) {
        window.open('http://localhost:4201/pages/tools/weblogo?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT AT LEAST 2 SEQUENCES');
      }
    } else if (type === 'ML') {
      if ((this.search_tools.match(/>/g) || []).length === 1) {
        window.open('http://localhost:4201/pages/tools/predict?sequence=' + encodeURI(this.search_tools),
          '_blank');
      } else {
        alert('ERROR: SELECT 1 SEQUENCE');
      }
    }
  }

  verify_checkbox(id: string, seq: string) {
    return this.search_tools.includes('>' + String(id) + '\n' + seq + '\n');
  }

  saveDataFile() {
    /**
     customColumn = 'idprotein';
     defaultColumns = ['name', 'class_field', 'activation', 'name_fusogenic_unit', 'location_fusogenic',
     'sequence_fusogenic', 'uniprotid', 'ncbiid', 'idtaxonomy', 'virus'];
     */
    this.data_all = [] as any;
    let data_to_print = 'idprotein,name,class_field,activation,name_fusogenic_unit,location_fusogenic,' +
      'sequence_fusogenic,uniprotid,ncbiid,idtaxonomy,virus\n';
    let protein = '';
    let taxonomy = '';
    if (this.protParam !== null) {
      protein = this.protParam;
    }
    if (this.taxParam !== null) {
      taxonomy = this.taxParam;
    }
    this.proteinService.receive_all(this.search_form.value, protein, taxonomy).subscribe(
      (data: Array<object>) => {
        this.data_all = data;

        for (const i of this.data_all) {
          data_to_print = data_to_print + i['idprotein'] + ',' + i['name'] + ',' + i['class_field'] + ','
            + i['activation'] + ',' + i['name_fusogenic_unit']
            + ',' + i['location_fusogenic'] + ',' + i['sequence_fusogenic'] + ',' + i['uniprotid']
            + ',' + i['ncbiid'] + ',' + i['idtaxonomy'] + ',' + i['virus'] + '\n';
        }

        this.keepData(data_to_print);
        

        /**
        const data_send = {data: data_print};
        this.proteinService.send(data_send).subscribe(
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
